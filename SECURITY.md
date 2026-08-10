# AnyLet — Security Model & Findings

> Audited against the working tree (including uncommitted changes) on **2026-07-24**.
> Companion documents: [ARCHITECTURE.md](ARCHITECTURE.md), [README.md](README.md).
>
> This document has two halves. **Part A** describes the security model as designed —
> what defends what, and why. **Part B** lists the places where the implementation
> diverges from that model, ranked by severity, each with a reproduction and a fix.

---

# Part A — The security model

## 1. Threat model

AnyLet is a two-sided rental marketplace handling real money in a market where the
payment rail is out-of-band SMS reconciliation. The attackers worth designing against:

| Actor | Wants | Primary defence |
|---|---|---|
| Ordinary user | Free listings, a Premium tier they didn't pay for, someone else's escrow | Blocked-field rules on `users`, server-computed amounts, backend-only money collections |
| Payment forger | Claim a booking without paying, or replay someone else's TxnID | TxnID-as-document-ID + single-claim transaction + webhook bearer secret |
| Curious landlord/tenant | Read another party's chats, KYC documents, or wallet | Participant-scoped rules, private Cloudinary assets, per-uid read predicates |
| Rogue/compromised admin | Read chats at will, silently move funds | Dispute-gated chat review, append-only `adminAuditLogs`, self-revocation block |
| Scraper / bot | Bulk-harvest listings and contact details | Per-IP rate limit, query caps, App Check (initialised, not enforced) |

## 2. Trust boundaries

There are exactly three, and each has one enforcement mechanism:

**B1 — Browser → Firestore (direct).** Enforced *solely* by `firestore.rules`.
Route guards in React are cosmetic; an attacker with the Firebase config (which ships in
the client bundle, by design) can call Firestore directly with their own token. Every
rule must hold on its own.

**B2 — Browser → `/api/*`.** Enforced by `withMiddleware` in
`api/_lib/middleware.js`: origin allowlist, method allowlist, per-IP rate limit, body
size cap, Firebase ID-token verification, optional admin-claim check, and HTML
stripping of all POST strings. Handlers additionally re-verify domain-specific
authorization (e.g. `api/escrow.js:216` re-reads the admin custom claim rather than
trusting the middleware flag alone).

**B3 — SMS watcher → `/api/sms-webhook`.** Enforced by a shared bearer secret compared
in constant time (`safeCompare`, `api/sms-webhook.js:27`). The module refuses to load if
`SMS_WEBHOOK_SECRET` is missing or shorter than 16 characters — a deploy-time failure is
preferred over an endpoint that accepts forged payment confirmations.

## 3. Authentication & authorization

**Identity** is Firebase Auth (email/password + Google, auto-linked on collision).

**Privilege** is the `admin` custom claim on the Firebase ID token — never a Firestore
field. `firestore.rules` reads `request.auth.token.admin == true`; the API middleware
reads `req.user.admin`. Granting or revoking it goes through
`POST /api/admin?action=set-claim`, which:

- requires an existing admin (`requireAdmin: true`),
- refuses to let an admin revoke their own claim (lock-out prevention,
  `api/admin.js:73`),
- calls `auth.revokeRefreshTokens` so the change takes effect immediately rather than
  after the current token expires,
- writes a `GRANT_ADMIN` / `REVOKE_ADMIN` record to `adminAuditLogs` with the actor UID
  and source IP.

`AuthContext` still falls back to the Firestore `role` field when the claim is absent
(`src/contexts/AuthContext.jsx:216`). That fallback only affects which UI renders — it
grants no data access, because neither the rules nor the middleware consult it.

## 4. Payment integrity

The design assumption is that **the client is hostile about money**. Concretely:

- **The client never sends an amount.** Both `create-payment-intent.js` and
  `verify-payment.js` call `rejectClientControlledFields()` first and 400 if the body
  contains `amount`, `expectedAmount`, `status`, `verified`, `verifiedAt`, or
  `verifiedBy`. The expected amount is recomputed server-side from
  `platformConfig/fees` via `api/_lib/feeCalculator.js`.
- **Replay is structurally impossible.** `unclaimed_transactions` uses the TxnID as the
  document ID, and the claim happens inside `db.runTransaction` with a status check.
  Two concurrent claims of the same TxnID cannot both win.
- **Enumeration is blocked.** No client — not even the paying user — can read
  `unclaimed_transactions` (`firestore.rules:145`). Otherwise a user could list
  unclaimed TxnIDs and claim someone else's payment.
- **Near-misses go to a human.** A mismatch within 50 BDT is written to
  `flagged_transactions`, the TxnID is locked as `held_for_review`, and the API returns
  202. Anything beyond that is a hard 422.
- **Provider is cross-checked.** The provider the user declares must match what the SMS
  webhook recorded, or the claim is rejected (`api/verify-payment.js:301`).
- **Sanity bounds at ingest.** Amounts outside `[1, 100000]` BDT are stored as
  `suspicious` and can never be auto-claimed. The webhook still returns 200 so the
  watcher app does not retry-loop.

Every financial mutation runs inside a Firestore transaction with all reads issued before
any writes. Withdrawals debit and record atomically, so a failed record write rolls the
balance back.

## 5. Privacy controls

- **Chat is dispute-gated for admins.** `api/admin.js:113` will not return a
  conversation unless `disputes` holds an `open` record for that booking, or the escrow
  is `disputed`. Denials are logged with the same fidelity as grants. The response is
  read-only — there is no admin write path into messages.
- **KYC documents are private assets.** `api/cloudinary-sign.js:24` pins
  `type: 'private'` into the signature for KYC uploads, so the resulting Cloudinary URL
  is not publicly addressable.
- **Upload folders are token-derived.** The signed folder is `users/{req.user.uid}` from
  the verified token, never from the request body.
- **Messages are immutable to clients.** `firestore.rules:276` — `allow update, delete:
  if isAdmin()`.

## 6. Input handling

Defence-in-depth, applied at both ends:

| Layer | Mechanism |
|---|---|
| Client, before write | `DOMPurify.sanitize(..., { ALLOWED_TAGS: [] })` on message text (`messageService.js:131`) and on listing title/description (`AddProperty.jsx:316`) |
| API, on every POST | `sanitize-html` with `allowedTags: []`, applied recursively to every string in the body (`middleware.js:89`) |
| Rendering | No `dangerouslySetInnerHTML` anywhere in `src/` — React's default escaping is the last line |
| Identifiers | TxnIDs are stripped to `[A-Za-z0-9]` and upper-cased on both webhook ingest and claim |
| Bank details | Rejected if they contain `< > " ' \` (`request-withdrawal.js:20`) |

## 7. Secrets

| Secret | Location | Exposure |
|---|---|---|
| `FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_CLIENT_EMAIL` | Vercel env | server only |
| `CLOUDINARY_API_SECRET`, `CLOUDINARY_API_KEY` | Vercel env | server only |
| `SMS_WEBHOOK_SECRET` | Vercel env + the watcher phone | server only |
| `CRON_SECRET` | Vercel env | server only |
| `UPSTASH_REDIS_REST_*` | Vercel env | server only |
| `VITE_FIREBASE_*` | build-time | **public by design** — shipped in the bundle; Firebase web config is not a secret, `firestore.rules` is the control |
| reCAPTCHA Enterprise site key | hardcoded, `src/firebase.js:28` | **public by design** — site keys are meant to be client-visible |

`.gitignore` covers `.env`, `.env.*`, `*firebase-adminsdk*.json`, `*serviceAccount*.json`.
Verified: **no `.env` file and no service-account JSON is tracked in git.** `.env` and
`.env.local` exist on this machine only and both contain a live admin private key —
treat this workstation as a credential-bearing host.

## 8. Reporting a vulnerability

Do not open a public GitHub issue. Email the maintainer at the address on the
[GitHub profile](https://github.com/safihasan96), with reproduction steps and impact.
Expect an acknowledgement within 72 hours.

---

# Part B — Findings

Severity reflects exploitability × blast radius. "Broken" findings (the flow simply
does not work) are included because they are indistinguishable from an outage to users
and, in the payment path, from a fraud signal.

| # | Severity | Finding | Status |
|---|---|---|---|
| [C-1](#c-1-the-internal-technical-audit-report-is-published-on-the-live-site) | **Critical** | Internal vulnerability report served publicly | Open |
| [H-1](#h-1-the-active-beta-listing-flow-is-rejected-by-the-properties-create-rule) | High | Beta listing creation violates its own rules | Open |
| [H-2](#h-2-kyc-submission-is-blocked-by-its-own-rules) | High | KYC submission blocked by rules | Open |
| [H-3](#h-3-csp-and-security-headers-never-reach-the-actual-app) | High | CSP/HSTS applied to API responses only | Open |
| [H-4](#h-4-query_limitshard_cap-is-undefined-and-is-passed-to-limit) | High | `HARD_CAP` undefined → runtime crash on 3 pages | Open |
| [H-5](#h-5-admin-ui-writes-directly-to-backend-only-collections) | High | Admin panel writes to `write: if false` collections | Open |
| [H-6](#h-6-seeded-referral-commission-is-50-not-05) | High | Default referral commission is 50% of every payment | Open |
| [M-1](#m-1-any-user-can-write-an-arbitrary-notification-to-any-other-user) | Medium | Unrestricted cross-user notification writes | Open |
| [M-2](#m-2-public-pages-read-usersuid-which-the-rules-deny) | Medium | Public owner profile denied by rules | Open |
| [M-3](#m-3-rate-limiting-is-per-ip-global-and-trusts-x-forwarded-for) | Medium | Rate limit keyed on a spoofable header, shared across endpoints | Open |
| [M-4](#m-4-otp-flow-writes-to-a-collection-the-catch-all-denies) | Medium | OTP flow non-functional, `Math.random()` codes | Open |
| [M-5](#m-5-app-check-is-initialised-but-never-enforced) | Medium | App Check provides no protection | Open |
| [M-6](#m-6-five-dependency-advisories-one-critical) | Medium | 5 npm advisories incl. 1 critical | Open |
| [M-7](#m-7-four-orphaned-endpoints-remain-deployed-and-reachable) | Medium | Unused endpoints still live | Open |
| [L-1](#l-1-no-production-error-reporting) | Low | `captureError` is a no-op stub | Open |
| [L-2](#l-2-blanket-html-stripping-can-silently-corrupt-payloads) | Low | Recursive sanitizer mangles legitimate strings | Open |
| [L-3](#l-3-no-ci-no-enforced-lint-233-eslint-errors) | Low | No CI gate; 233 lint errors | Open |
| [L-4](#l-4-cron-endpoint-is-live-but-never-scheduled) | Low | Rent reminders never fire | Open |

---

## C-1 — The internal technical audit report is published on the live site

**Where:** `public/AnyLet_Technical_Audit_Report.md` (git-tracked), copied verbatim to
`dist/AnyLet_Technical_Audit_Report.md` by every build.

Anything in `public/` is served as a static asset at the site root. This 25 KB file is a
prior security audit — it enumerates the project structure, the auth flow, the payment
architecture, and a list of known vulnerabilities described as "critical security, logic,
and reliability bugs that must be fixed before full public launch."

**Reproduce:**

```bash
curl -s https://anylet.com/AnyLet_Technical_Audit_Report.md | head -20
```

**Impact:** A complete, self-authored attack roadmap, free to any unauthenticated
visitor. This is the single highest-value finding in this document: it hands an attacker
the rest of this list without any work on their part.

**Fix:** Remove the file from `public/` and from git history (it has been committed, so
deleting the file alone leaves it in the repo's past), rebuild, and redeploy. Move all
audit documents outside `public/` — `_Anylet_Docs/` is the right home. Then add a guard
so this cannot recur:

```bash
# fails the build if any .md lands in public/
test -z "$(find public -name '*.md')" || { echo "No .md in public/"; exit 1; }
```

---

## H-1 — The active beta listing flow is rejected by the `properties` create rule

**Where:** `src/pages/AddProperty.jsx:333-343` vs `firestore.rules:87-90`.

`IS_BETA` is `true`, so listings are written straight from the browser with:

```js
isApproved: true,
listingPaymentId: 'BETA_FREE',
status: 'Available',
```

The create rule requires the opposite:

```
allow create: if isSignedIn()
              && request.resource.data.ownerId == request.auth.uid
              && request.resource.data.isApproved == false
              && request.resource.data.status in ['draft', 'pending_payment', 'Pending'];
```

`isApproved: true` fails the third clause and `status: 'Available'` fails the fourth.
The paid path (`handlePaymentSubmitted`, line ~407) sets `isApproved: false` but still
sets `status: 'Available'` — so it fails too. **Neither listing path satisfies the rules
in this file.**

**Impact:** Either every listing creation fails with `permission-denied` (surfacing to
the user as the generic "Failed to publish property" toast at `AddProperty.jsx:357`), or
— worse — the deployed rules differ from `firestore.rules` in this repo, in which case
this file does not describe production and none of the guarantees in Part A can be
trusted. Determine which before anything else.

**Reproduce:**

```bash
firebase emulators:start --only firestore   # port 9090
# then attempt a client create with isApproved:true, status:'Available'
```

**Fix:** Decide where beta auto-approval is authorized. The correct answer is *not* to
loosen the create rule to permit client-set `isApproved: true` — that hands every user a
self-approval primitive that survives the beta. Instead, keep the rule as-is, have the
client create with `isApproved: false, status: 'Pending'`, and flip approval from the
Admin SDK behind the same `IS_BETA` flag (a small `/api/` handler, or reuse the listing
branch of `verify-payment.js` with the fee waived).

---

## H-2 — KYC submission is blocked by its own rules

**Where:** `src/components/KYCVerification.jsx:172` vs `firestore.rules:205-208`.

The component uploads both ID images through the signed Cloudinary flow (correctly, with
`type: private`) and then writes the submission **directly from the browser**:

```js
await setDoc(doc(db, 'kycSubmissions', currentUser.uid), { ... });
```

The rules say:

```
match /kycSubmissions/{submissionId} {
  allow read: if isOwner(resource.data.uid) || isAdmin();
  allow write: if false;              // Backend only
}
```

Meanwhile `api/verify-kyc.js` — which exists precisely to perform this write via the
Admin SDK — is called by nothing. This regressed in the uncommitted change to
`KYCVerification.jsx` (133 lines changed), which replaced the API call with a direct
write.

**Impact:** Identity verification is dead. Users upload their national ID or passport to
Cloudinary — that part succeeds — and then get "KYC submission failed." The documents are
now sitting in Cloudinary with no corresponding record and no review path: personal
identity documents collected and orphaned.

**Fix:** Restore the API call. `api/verify-kyc.js` already does the right thing; point
`handleSubmit` back at `POST /api/cloudinary-sign` → upload →
`POST /api/verify-kyc { cloudinaryPublicIds, docType }`. Harden it while you are there:
it currently accepts arbitrary `cloudinaryPublicIds` from the client without checking the
IDs actually live under `users/{uid}/`, so a user can attach someone else's asset ID to
their own submission.

---

## H-3 — CSP and security headers never reach the actual app

**Where:** `api/_lib/middleware.js:34-41`, and the absence of a `headers` block in
`vercel.json`.

`setSecurityHeaders()` sets a well-formed CSP, `X-Frame-Options: DENY`, HSTS with
preload, `nosniff`, and `Referrer-Policy`. But `withMiddleware` only wraps `/api/*`
handlers, so those headers land on **JSON responses** — documents no browser renders as
HTML.

The SPA itself is served by Vercel's static handler via the
`{ "source": "/(.*)", "destination": "/index.html" }` rewrite, which applies no headers
at all. `vercel.json` in full:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Impact:** `anylet.com` ships with no CSP, no clickjacking protection, and no HSTS. The
application is framable — which matters for a site with in-app payment confirmation
screens — and any XSS that gets past DOMPurify has no second barrier.

**Verify:**

```bash
curl -sI https://anylet.com/ | grep -iE 'content-security|x-frame|strict-transport'
```

**Fix:** Move the headers into `vercel.json` where they apply to every response:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Content-Security-Policy", "value": "…" }
      ]
    }
  ],
  "rewrites": [ … ]
}
```

The existing CSP string needs widening before it will work on the real app — it must
also allow `https://api.cloudinary.com` and `https://*.cloudinary.com` (uploads and
images), `https://*.tile.openstreetmap.org` (Leaflet tiles), and
`https://*.googleapis.com` / `https://securetoken.googleapis.com` in `connect-src`.
Ship it `Content-Security-Policy-Report-Only` first and read the violation reports before
enforcing.

---

## H-4 — `QUERY_LIMITS.HARD_CAP` is undefined and is passed to `limit()`

**Where:** `src/config/queryLimits.js` defines 16 keys — `HARD_CAP` is not among them.
It is referenced at:

- `src/pages/AdminPanel.jsx:442`
- `src/pages/AdminPanel.jsx:460`
- `src/pages/PropertyDetails.jsx:158`
- and throughout `src/utils/safeQuery.js` (which nothing imports)

`limit(undefined)` throws `Function limit() requires its first argument to be of type
number` from the Firestore SDK.

**Impact:** `PropertyDetails.jsx:158` is on the hottest authenticated page in the app —
the query that hits it will reject, and depending on the surrounding `try`/`catch` either
surfaces an error state or takes the page down via `ErrorBoundary`. The two `AdminPanel`
call sites are in the data-migration/cleanup paths.

Note the second-order problem: `safeQuery.js` was written as *the* guard against
unbounded Firestore reads (labelled "F-08 remediation"), and it is both non-functional
and unused. The protection it was meant to provide does not exist.

**Fix:** Add the constant, then either wire up `safeDocs` or delete it — a guard nobody
calls is worse than no guard, because it reads as coverage.

```js
// src/config/queryLimits.js
const QUERY_LIMITS = {
  HARD_CAP: 200,   // absolute ceiling; no query may exceed this
  // …
};
```

While fixing, note `safeQuery.js:38` and `:53` reference `process.env.DEV`, which is
undefined in the browser (Vite exposes `import.meta.env.DEV`) — ESLint flags both as
`no-undef`.

---

## H-5 — Admin UI writes directly to backend-only collections

**Where:** `src/pages/AdminPanel.jsx` performs ~20 privileged Firestore writes from the
browser. Several target collections the rules mark `allow write: if false`:

| Line | Write | Rule |
|---|---|---|
| 615 | `updateDoc(payments/{id}, { status: 'completed' })` | `payments` — `write: if false` |
| 683 | `updateDoc(payments/{id}, { status: 'failed' })` | `payments` — `write: if false` |
| 674, 689, 706 | `updateDoc(escrowDeposits/{id}, { status })` | `escrowDeposits` — `write: if false` |

**Impact:** Two failure modes, both bad. If the deployed rules match this repo, these
admin actions silently fail — an admin clicks "mark paid", sees no error, and believes a
payment was reconciled when it was not. If the deployed rules are looser, then `payments`
and `escrowDeposits` are client-writable, and the entire "backend-only money collections"
guarantee in Part A is false.

**Fix:** Confirm the deployed rules first (`firebase firestore:rules:get`, or the console).
Then route every privileged mutation through `/api/`. `api/escrow.js?action=admin-action`
already implements force-release and force-refund correctly, with an audit log and
dispute auto-resolution — `AdminPanel` should call it instead of writing
`escrowDeposits.status` by hand. Payment status changes need an equivalent handler; the
direct-write path should be deleted, not patched.

---

## H-6 — Seeded referral commission is 50%, not 0.5%

**Where:** `seed_fees.js:22` and `src/hooks/useFees.js:12` both default:

```js
commissionRate: { type: "percentage", value: 0.50 }
```

`api/verify-payment.js:168` reads that value as a **decimal multiplier**:

```js
const commissionRate = Number(feesData.commissionRate?.value) || 0.02;
const commissionAmount = parseFloat((txData.amount * commissionRate).toFixed(2));
```

`0.50` × amount = **50% of every payment** credited to the payer's referrer.
`AdminFeesTab.jsx:22` treats the same field as a whole-number percentage in the UI
(`value: 2` meaning 2%) and divides by 100 on save (`:105`), so the admin form and the
seed disagree about units by a factor of 100.

The blast radius is limited to referred users, and only if `seed_fees.js` was actually
run against production and never corrected via the admin UI — **verify
`platformConfig/fees.commissionRate` in the live database before assuming this is
theoretical.**

Corroborating evidence that this has bitten before: `api/escrow.js:24-35` carries an
explicit guard with the comment *"Falls back to 5% if the field is absent so a
mis-config never causes 50% listing commissions to be accidentally applied to tenant
deposits."*

**Fix:**

1. Read the live value now. If it is `0.5`, every referral commission paid to date was
   50% — reconcile `commissions` and `referralWallet` before touching anything else.
2. Correct the seed and the `useFees` fallback to the intended rate (`0.02`).
3. Add a range assertion in `feeCalculator.js` so a percentage-shaped field can never be
   used raw: reject `commissionRate` outside `[0, 0.3]` and fall back to the default,
   mirroring the guard `escrow.js` already has.
4. Store the unit in the document (`{ type: 'decimal', value: 0.02 }`) and have every
   reader assert on `type` rather than inferring it.

---

## M-1 — Any user can write an arbitrary notification to any other user

**Where:** `firestore.rules:292` (introduced in the uncommitted diff, replacing
`allow create: if isAdmin()`):

```
allow create: if isSignedIn()
              && request.resource.data.userId != request.auth.uid;
```

The only constraint is that you cannot notify *yourself*. Title, body, `type`, `link`,
and `metadata` are entirely attacker-controlled, and the recipient UID is any UID you can
name.

**Impact:** In-app phishing — a notification reading "Payment failed, re-enter your
bKash TxnID here" with a `link` of the attacker's choosing, delivered inside the trusted
UI. Also unbounded spam (each notification is a Firestore write billed to the project)
and, since notification writes are unauthenticated as to *sender*, no way to attribute
abuse.

The legitimate need behind the change is real: a tenant sending a viewing request must
notify the owner. But that write should not originate from the tenant's browser.

**Fix — preferred:** move notification creation into the Admin SDK. The server already
knows who is acting and can validate that a notification about booking X is going to a
participant in booking X.

**Fix — interim, if the client write must stay:** constrain shape and provenance in the
rule:

```
allow create: if isSignedIn()
              && request.resource.data.userId is string
              && request.resource.data.userId != request.auth.uid
              && request.resource.data.keys().hasOnly(
                   ['userId','type','title','message','link','isRead','createdAt','metadata'])
              && request.resource.data.senderId == request.auth.uid
              && request.resource.data.isRead == false
              && request.resource.data.type in
                   ['request_received','booking_confirmed','review_received','system']
              && request.resource.data.title.size() <= 120
              && request.resource.data.message.size() <= 500
              && request.resource.data.link.matches('^/[a-zA-Z0-9/_-]*$');
```

The `senderId` requirement is the important one — it makes abuse attributable. Note this
requires adding `senderId` in `notificationService.createNotification`.

**Also fix the schema drift:** `src/utils/notificationService.js:27` writes a `message`
field; the backend writers (`request-withdrawal.js:131`, `approve-withdrawal.js:83`,
`cron-rent-reminders.js:58`) write `body`. Consumers must handle both. Pick one.

---

## M-2 — Public pages read `users/{uid}`, which the rules deny

**Where:**

- `src/pages/OwnerProfile.jsx:85` — `getDoc(doc(db, 'users', id))` on the public
  `/owner/:id` route
- `src/pages/PropertyDetails.jsx:141` and `:293` — fetching the owner card on the public
  `/property/:id` route

The rule is owner-or-admin only:

```
match /users/{uid} { allow read: if isOwner(uid) || isAdmin(); }
```

**Impact:** Every visitor who is not the owner themselves — including every logged-out
visitor, i.e. most organic traffic — gets `permission-denied` on the owner block of a
listing page. Listings render without the landlord's name, photo, or verification badge,
which is exactly the trust signal a rental marketplace depends on.

This is the correct rule and the wrong data model: `users` legitimately holds private
fields (`referralWallet`, `personalDetails.phoneNumber`, `subscriptionTier`,
`kycStatus`) that must never be public, so it cannot simply be opened up.

**Fix:** Split public profile data into its own collection, written by the Admin SDK (or
by the user under a strict field allowlist) and mirrored on profile update:

```
match /publicProfiles/{uid} {
  allow read: if true;
  allow write: if false;    // Admin SDK mirrors displayName, photoURL, isVerified, joinedAt
}
```

Then point `OwnerProfile` and `PropertyDetails` at `publicProfiles`. Do **not** widen the
`users` read rule.

---

## M-3 — Rate limiting is per-IP-global and trusts `X-Forwarded-For`

**Where:** `api/_lib/middleware.js:26-32` and `:43-86`.

Two problems:

1. **The key is the raw first entry of `X-Forwarded-For`.** A client can send
   `X-Forwarded-For: 1.2.3.4` and, since Vercel appends rather than replaces, control
   the value this code reads — trivially bypassing the limit by rotating a header.
2. **One bucket for all endpoints.** `rate_limit:${ip}` is shared, so the budget for
   `/api/verify-payment` (30/min) is the same pool as `/api/cloudinary-sign`. Uploading
   five listing photos consumes a meaningful share of a user's payment-verification
   budget, and conversely an attacker's brute-force attempts against one endpoint are
   indistinguishable from another's legitimate traffic.

The in-memory fallback also does not survive serverless cold starts, so without Upstash
configured the limit is close to decorative.

**Fix:**

```js
function getIp(req) {
  // Vercel's own header is not client-settable; prefer it.
  return req.headers['x-vercel-forwarded-for']
      || req.headers['x-real-ip']
      || (req.headers['x-forwarded-for'] || '').split(',').pop().trim()  // last hop, not first
      || req.socket?.remoteAddress
      || 'unknown';
}
```

Key the bucket per endpoint and, for authenticated routes, per UID:
`rate_limit:${req.url.split('?')[0]}:${req.user?.uid ?? ip}`. Give the money endpoints a
much tighter budget than the read endpoints — 30/min against `/api/verify-payment` is a
lot of TxnID guesses.

---

## M-4 — OTP flow writes to a collection the catch-all denies

**Where:** `src/utils/otp.js:47` writes `otp_verifications/{email}`. That collection
appears nowhere in `firestore.rules`, so it falls through to
`match /{document=**} { allow read, write: if false; }`.

Three defects stack:

1. The write is denied — the flow cannot work at all.
2. Codes come from `Math.random()` (`otp.js:16`), which is not cryptographically secure
   and is predictable from prior outputs.
3. Delivery uses placeholder EmailJS credentials (`service_xxxxxx`), so no email would
   send even if the write succeeded. Unlike `emailService.js:32`, `otp.js` does not
   detect the placeholder and will throw.

Additionally, keying the document by **email address** would make every pending OTP
enumerable by email if the collection were ever opened up.

**Fix:** Delete this module. Firebase Auth provides email verification and phone OTP
natively, both already available in this project. If a custom OTP is genuinely required,
it must be generated and verified server-side (`crypto.randomInt`), stored keyed by UID
with a TTL and an attempt counter, and never readable by any client.

---

## M-5 — App Check is initialised but never enforced

**Where:** `src/firebase.js:27-30` initialises App Check with reCAPTCHA Enterprise.
Nothing consumes the attestation: `firestore.rules` has no `request.app` check, and
`api/_lib/middleware.js` never validates an App Check token.

**Impact:** App Check currently costs a reCAPTCHA round-trip on every page load and buys
nothing. Bot protection against listing scraping and automated account creation — the
stated reason it was added ("Initialize App Check for Bot Protection") — is absent.

**Fix:** Enforce it where it counts. In the Firebase console, turn on App Check
enforcement for Firestore (start in monitoring mode and watch the unverified-request
ratio for a week — Capacitor builds need their own attestation providers registered, and
enforcing before those are configured locks out the mobile apps). For the API, verify the
`X-Firebase-AppCheck` header in `withMiddleware` via `getAppCheck().verifyToken()` on the
unauthenticated, abuse-prone routes.

---

## M-6 — Five dependency advisories, one critical

`npm audit --production` on the current lockfile:

| Package | Severity | Advisory |
|---|---|---|
| `websocket-driver` | **critical** | Resource limit bypass via message compression; message corruption via protocol length headers |
| `fast-xml-parser` | high | Repeated DOCTYPE declarations reset entity expansion limits |
| `brace-expansion` (via `google-gax`) | high | — |
| `protobufjs` | moderate | DoS via infinite loop in `.proto` option parsing |
| `dompurify` ≤ 3.4.11 | low | `CUSTOM_ELEMENT_HANDLING` bypasses `afterSanitizeElements` |

The `dompurify` one deserves attention out of proportion to its "low" rating: DOMPurify
is this codebase's primary XSS control on user-generated listing and message content, and
per [H-3](#h-3-csp-and-security-headers-never-reach-the-actual-app) there is currently no
CSP behind it. The others reach the app only transitively through `firebase-admin`'s
dependency tree.

**Fix:**

```bash
npm audit fix
npm run build && npm run test:rules
```

Then add `npm audit --production --audit-level=high` to CI (see
[L-3](#l-3-no-ci-no-enforced-lint-233-eslint-errors)) so this does not silently
re-accumulate. The existing `overrides` block in `package.json` (`js-yaml`, `uuid`,
`esbuild`, `jose`) shows this was handled manually once before.

---

## M-7 — Four orphaned endpoints remain deployed and reachable

`api/approve-withdrawal.js`, `api/create-payment-intent.js`, `api/verify-kyc.js`, and
`api/cron-rent-reminders.js` are referenced by nothing in `src/`.

They are still deployed, still routable, still authenticated only by their own
middleware options — and unmonitored, because no user flow exercises them. Two are
money-adjacent: `create-payment-intent` writes `paymentIntents` documents, and
`approve-withdrawal` moves wallet balances and marks withdrawals approved. An attacker
with a valid admin token can call `approve-withdrawal` directly even though no UI does.

They also consume 4 of the 12 Vercel Hobby function slots — the same constraint that
forced `admin.js` and `escrow.js` to be `?action=` routers.

**Fix:** Two of them should come back into use rather than be deleted:
`verify-kyc` is the correct fix for [H-2](#h-2-kyc-submission-is-blocked-by-its-own-rules),
and `approve-withdrawal` is the missing admin half of a withdrawal flow whose user half
(`request-withdrawal`) is live — users can currently request withdrawals that no UI can
approve. Wire both up. Then either schedule `cron-rent-reminders` (add a `crons` block to
`vercel.json`, see [L-4](#l-4-cron-endpoint-is-live-but-never-scheduled)) or delete it,
and delete `create-payment-intent` unless the intent/reference-code flow is on the
roadmap.

---

## L-1 — No production error reporting

`src/utils/logger.js:19` — `captureError()` has a TODO and a body of `void context; void
err;`. In production `info`/`debug`/`warn` are stripped and `error` goes nowhere.

**Impact:** A failing payment verification, a `permission-denied` on listing creation
([H-1](#h-1-the-active-beta-listing-flow-is-rejected-by-the-properties-create-rule)), or
a KYC write rejection ([H-2](#h-2-kyc-submission-is-blocked-by-its-own-rules)) produces
no signal anywhere. Several findings in this document are the kind of thing that would
have been caught in hours with error reporting; they have instead been latent.

**Fix:** Wire Sentry (or equivalent) into `captureError` and into the `catch` block of
`withMiddleware`. Scrub PII before sending — bank details, phone numbers, and TxnIDs must
not leave the platform in a breadcrumb.

---

## L-2 — Blanket HTML stripping can silently corrupt payloads

`api/_lib/middleware.js:89-104` runs `sanitize-html` with `allowedTags: []` recursively
over every string in every POST body, including object **values** that are not
user-visible content.

`sanitize-html` also entity-decodes and re-encodes. A property description containing
`Rent < 20000 & negotiable` is stored as `Rent &lt; 20000 &amp; negotiable` and renders
literally, since React escapes on output — double-encoding. It also silently truncates
anything after an unmatched `<`.

**Impact:** Low — cosmetic corruption of listing text and chat messages, not a security
hole. Worth noting mainly because the belt-and-braces sanitization (client DOMPurify +
server `sanitize-html` + React escaping) is applied indiscriminately rather than at the
boundary where it is needed.

**Fix:** Sanitize named free-text fields explicitly in each handler, rather than every
string everywhere. Keep the recursive pass only for fields that are rendered as content.

---

## L-3 — No CI, no enforced lint, 233 ESLint errors

`npx eslint src api` reports **233 errors and 13 warnings**. There is no GitHub Actions
workflow, no pre-commit hook, and no test or lint gate before Vercel deploys on push.
`npm run test:rules` (4 assertions against the emulator) must be run by hand.

Notable among the errors: `safeQuery.js:38,53` use `process.env.DEV`, undefined in the
browser; several unused-import errors in `src/utils/animations.jsx` and `src/testWrite.js`.

**Fix:** Add a workflow that runs on every PR:

```yaml
- run: npm ci
- run: npm run lint
- run: npm run build
- run: npm audit --production --audit-level=high
- run: |
    npx firebase emulators:exec --only firestore "npm run test:rules"
```

Fix the errors in one pass first, then turn the gate on — a gate that is red on day one
gets disabled by day three. Expand `tests/firestore.rules.test.mjs` beyond its current 4
assertions: every rule in Part A that this document claims as a control deserves a test,
starting with the ones [H-1](#h-1-the-active-beta-listing-flow-is-rejected-by-the-properties-create-rule),
[H-2](#h-2-kyc-submission-is-blocked-by-its-own-rules), and
[H-5](#h-5-admin-ui-writes-directly-to-backend-only-collections) would have caught.

---

## L-4 — Cron endpoint is live but never scheduled

`api/cron-rent-reminders.js` is correctly built — `CRON_SECRET` bearer check, a
deterministic idempotency key (`rent_reminder_{moveInId}_{YYYY}_{MM}`) that survives
double-firing, and batched writes. But `vercel.json` has no `crons` block, so it never
runs. No tenant has ever received a rent reminder.

Two smaller bugs to fix at the same time:

- `api/cron-rent-reminders.js:36` — `String(currentMonth).padStart(2,'0')` uses the
  **0-indexed** `getMonth()`, so January's key is `_00` and December's is `_11`. Harmless
  for idempotency (it is stable), confusing in queries. Use `currentMonth + 1`.
- `:23` — `.limit(100)` on active move-ins means the job silently stops covering tenants
  past the hundredth. Paginate.

**Fix:**

```json
"crons": [
  { "path": "/api/cron-rent-reminders", "schedule": "0 3 * * *" }
]
```

Vercel cron sends `Authorization: Bearer $CRON_SECRET` automatically once `CRON_SECRET`
is set in project env.

---

# Remediation order

Sequenced by risk-reduction per unit of work, not by severity alone.

**Now (hours):**
1. [C-1](#c-1-the-internal-technical-audit-report-is-published-on-the-live-site) — delete the published audit report, purge from git history, redeploy.
2. [H-6](#h-6-seeded-referral-commission-is-50-not-05) — read the live `commissionRate`; if it is `0.5`, reconcile referral payouts before anything else.
3. Confirm the deployed `firestore.rules` matches this repo. Everything in Part A depends on the answer, and [H-1](#h-1-the-active-beta-listing-flow-is-rejected-by-the-properties-create-rule) / [H-5](#h-5-admin-ui-writes-directly-to-backend-only-collections) mean the two versions currently cannot both be true.

**This week:**
4. [H-1](#h-1-the-active-beta-listing-flow-is-rejected-by-the-properties-create-rule) — listing creation (core flow, currently broken or rules-divergent).
5. [H-2](#h-2-kyc-submission-is-blocked-by-its-own-rules) — restore the KYC API path; deal with the orphaned identity documents already in Cloudinary.
6. [H-4](#h-4-query_limitshard_cap-is-undefined-and-is-passed-to-limit) — one-line constant, fixes a crash on the busiest page.
7. [M-1](#m-1-any-user-can-write-an-arbitrary-notification-to-any-other-user) — constrain the notification create rule.
8. [M-2](#m-2-public-pages-read-usersuid-which-the-rules-deny) — `publicProfiles` collection.

**This month:**
9. [H-3](#h-3-csp-and-security-headers-never-reach-the-actual-app) — headers in `vercel.json`, report-only first.
10. [H-5](#h-5-admin-ui-writes-directly-to-backend-only-collections) — route admin mutations through `/api/`.
11. [L-1](#l-1-no-production-error-reporting) — error reporting, so the next one of these is found in hours not months.
12. [L-3](#l-3-no-ci-no-enforced-lint-233-eslint-errors) — CI gate + rules tests for every control claimed in Part A.
13. [M-3](#m-3-rate-limiting-is-per-ip-global-and-trusts-x-forwarded-for), [M-5](#m-5-app-check-is-initialised-but-never-enforced), [M-6](#m-6-five-dependency-advisories-one-critical), [M-7](#m-7-four-orphaned-endpoints-remain-deployed-and-reachable).

**Backlog:** [M-4](#m-4-otp-flow-writes-to-a-collection-the-catch-all-denies),
[L-2](#l-2-blanket-html-stripping-can-silently-corrupt-payloads),
[L-4](#l-4-cron-endpoint-is-live-but-never-scheduled).
