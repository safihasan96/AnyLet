# AnyLet — Architecture

> Rental marketplace for Bangladesh. React 19 SPA + Vercel serverless functions + Firebase (Auth/Firestore) + Cloudinary, with mobile-money (bKash/Nagad/Rocket) payment reconciliation over SMS.
>
> Version `1.0.1` · Last verified against the working tree on 2026-07-24.
> Companion documents: [SECURITY.md](SECURITY.md), [README.md](README.md).

---

## 1. System shape

```
                    ┌──────────────────────────────────────────────┐
   Browser / PWA    │  React 19 SPA (Vite 7)                       │
   Capacitor iOS ───│  route-level code splitting, 4 React contexts│
   Capacitor Android│  Firebase Web SDK (auth + firestore direct)  │
                    └───────┬──────────────────────────┬───────────┘
                            │                          │
             direct Firestore reads/writes      HTTPS + Firebase ID token
             (governed by firestore.rules)             │
                            │                          ▼
                            │            ┌──────────────────────────────┐
                            │            │ Vercel Serverless (api/*.js) │
                            │            │ withMiddleware() wrapper     │
                            │            │ firebase-admin SDK           │
                            │            └───────┬─────────────┬────────┘
                            ▼                    ▼             ▼
                    ┌────────────────┐   ┌──────────────┐  ┌─────────────┐
                    │ Cloud Firestore│   │  Cloudinary  │  │ Upstash     │
                    │ (rules-guarded)│   │ signed upload│  │ Redis       │
                    └────────────────┘   └──────────────┘  │ (rate limit)│
                            ▲                              └─────────────┘
                            │
                    ┌───────┴────────────┐
                    │ SMS watcher app on │  → POST /api/sms-webhook
                    │ a phone (external) │     (bearer secret)
                    └────────────────────┘
```

The system is **dual-path**: the browser talks to Firestore directly for most reads and
for non-financial writes, and goes through serverless functions for anything that must
not be client-controlled (money, custom claims, KYC review, media signing).
`firestore.rules` is therefore not a supporting control — it is one of the two primary
enforcement surfaces. See [SECURITY.md](SECURITY.md#2-trust-boundaries).

---

## 2. Repository layout

| Path | Role |
|---|---|
| `src/main.jsx` | DOM mount; wraps `App` in `ErrorBoundary → HelmetProvider → BrowserRouter → AuthProvider → ThemeProvider → LanguageProvider → ToastProvider`. Registers the PWA service worker. |
| `src/App.jsx` | Single route table (~50 routes). Every page is `React.lazy`. Route guards, chrome visibility rules (which nav bars show on which path). |
| `src/pages/` | 46 page components. Largest: `AdminPanel.jsx` (2027 lines), `AddProperty.jsx` (1121), `Account.jsx` (1010), `PropertyDetails.jsx` (1002). |
| `src/pages/admin/` | Newer admin surface (`AdminLayout`, `AdminOverview`, `AdminMoneyManagement`, `AdminChatReview`) — a partial migration away from `AdminPanel.jsx`. |
| `src/components/` | ~55 components. `map/` holds the Leaflet layer; `listings/`, `layout/`, `ui/` are thin. |
| `src/contexts/` | `AuthContext` (session + user doc + role), `ThemeContext`, `LanguageContext`, `ToastContext`. |
| `src/hooks/` | `useFees`, `useFirestoreSnapshot`, `useSavedProperties`, `useReferral`, `useInfiniteScroll`, `useMediaQuery`. |
| `src/utils/` | `messageService`, `notificationService`, `reviewService`, `commissionService`, `emailService`, `otp`, `referral`, `logger`, `safeQuery`, `api`. |
| `src/config/` | `featureFlags.js` (`IS_BETA`), `queryLimits.js`. |
| `api/` | 11 Vercel functions + `api/_lib/` (admin SDK init, middleware, fee calculator). |
| `firestore.rules` | 385 lines. The authoritative client-side authorization policy. |
| `tests/firestore.rules.test.mjs` | 4 emulator-based rules tests. The only automated tests in the repo. |
| `android/`, `ios/`, `capacitor.config.json` | Capacitor 8 native shells wrapping the same build output. |
| `mobile/`, `zip/` | Abandoned parallel prototypes (Expo, and an early TS mockup). Not built, not deployed. |

Root also holds ~20 loose scratch files (`test-*.js`, `debug-render.js`, `scratch.mjs`,
`fix_router.js`, `browser_mission*.mjs`, screenshots, `*.png`, `vercel_logs.json`) and
three prior audit/report markdown files. None participate in the build.

---

## 3. Frontend

### 3.1 Rendering & routing

Client-side only — no SSR, no prerender. `vercel.json` rewrites everything except
`/api/*` to `index.html`.

Every page is lazy-loaded behind a single `<Suspense>` with a skeleton fallback, and
wrapped in `<AnimatePresence mode="wait">` keyed on `location.pathname` so route
changes animate. `PageWrapper` applies the per-page motion variants.

`vite.config.js` pins manual chunks so the vendor split is stable across builds:
`vendor-react`, `vendor-motion`, `vendor-firebase-app/-auth/-firestore`, `vendor-icons`,
`vendor-leaflet`. Leaflet and `AdminPanel` are the two heaviest chunks and are only
fetched on `/map` and `/admin` respectively. The stated goal is a ~200 KB initial
payload for 3G/4G users in Bangladesh.

### 3.2 Route guards

Three composable guards, all **UX-level only** — they hide UI, they do not protect data.

| Guard | Check | File |
|---|---|---|
| `ProtectedRoute` | `currentUser` truthy, else `<Navigate to="/login">` | `src/components/ProtectedRoute.jsx` |
| `AdminRoute` | waits for `loading`, then requires `userRole === 'admin'` | `src/components/AdminRoute.jsx` |
| `OnboardingGuard` | gates `/setup-owner-profile` on onboarding state | `src/components/OnboardingGuard.jsx` |
| `RoleRoute` | generic role gate; references roles (`adviser`, `client`) that no longer exist — **dead code** | `src/components/RoleRoute.jsx` |

Real enforcement is `firestore.rules` (for direct reads/writes) and
`withMiddleware({ requireAdmin: true })` (for API calls).

### 3.3 Auth model

`src/contexts/AuthContext.jsx` owns the whole session:

1. `onAuthStateChanged` fires → read the ID token result.
2. `isAdminClaim = !!token.claims.admin` — the custom claim is the source of truth.
3. Fetch `users/{uid}`; set `userRole = isAdminClaim ? 'admin' : (data.role || 'user')`.
4. Backfill missing fields in place (`referralCode`, `referralWallet`, onboarding block)
   with a fire-and-forget `updateDoc`.

Providers: email/password and Google. Google sign-in auto-links to an existing
password account — on `auth/account-exists-with-different-credential` the context throws
a synthetic `auth/link-required` error carrying the pending credential, and the caller
re-prompts for the password before `linkWithCredential`.

Persistence is `browserLocalPersistence`. App Check (reCAPTCHA Enterprise) is
initialised in `src/firebase.js` but is not enforced anywhere.

### 3.4 State

No Redux/Zustand/React Query. State lives in:

- **React context** for cross-cutting concerns (4 providers, all in `main.jsx`).
- **Firestore listeners** for live data — `onSnapshot` via `useFirestoreSnapshot` and
  `messageService.subscribeToConversations` / `subscribeToMessages`.
- **Module-level caches** for a couple of hot paths — `useFees.js` keeps `cachedFees`
  and an in-flight `fetchPromise` in module scope so the fee document is read once per
  page load rather than once per component.

### 3.5 Styling

Tailwind v4 via the Vite plugin — no `tailwind.config.js`. Design tokens live in the
`@theme` block of `src/index.css`. A handful of components keep sidecar CSS files
(`Header.css`, `Hero.css`, `PropertyCard.css`, `AdminPanelLayout.css`,
`admin/AdminDesignSystem.css`). Framer Motion handles all animation; `MotionConfig
reducedMotion="user"` respects the OS setting globally.

---

## 4. Backend — `api/`

### 4.1 Middleware

`api/_lib/middleware.js` exports `withMiddleware(handler, options)`. Every function is
wrapped. In order:

1. **CORS** — origin allowlist (`anylet.com`, `www.anylet.com`, `any-let.vercel.app`,
   localhost:5173/5174/3000/3001) plus a regex for this project's Vercel preview URLs.
   `OPTIONS` short-circuits with 200.
2. **Security headers** — `nosniff`, `X-Frame-Options: DENY`, HSTS, `Referrer-Policy`,
   and a CSP. *(These land on API JSON responses only — see
   [SECURITY.md](SECURITY.md#h-3-csp-and-security-headers-never-reach-the-actual-app).)*
3. **Method allowlist** → 405 with `Allow`.
4. **Rate limit** — 30 requests / 60 s per IP. Upstash Redis (`INCR` + `EXPIRE`
   pipeline) when configured, in-process `Map` otherwise.
5. **Body limit** — `Content-Length` and serialized-size check, default 10 KB.
6. **Auth** — `Bearer` Firebase ID token → `auth.verifyIdToken` → `req.user`.
   `requireAdmin` additionally demands `req.user.admin === true` or
   `req.user.role === 'admin'`.
7. **Payload sanitization** — every string in a POST body is run through
   `sanitize-html` with `allowedTags: []`.

### 4.2 Endpoints

| Endpoint | Auth | Purpose | Called from |
|---|---|---|---|
| `POST /api/verify-payment` | user | The core money path. Claims an SMS-observed TxnID and applies all downstream business logic. | `PaymentModal.jsx:165` |
| `GET,POST,PUT,PATCH /api/sms-webhook` | shared bearer secret | Records observed mobile-money transactions into `unclaimed_transactions`. | external SMS watcher app |
| `POST /api/escrow?action=confirm\|dispute\|admin-action` | user (admin re-checked in-handler) | Escrow lifecycle. | `MyBookings`, `OwnerBookings`, `AdminMoneyManagement` |
| `POST /api/admin?action=review-kyc\|set-claim\|chat-review` | admin | KYC decisions, admin-claim grant/revoke, dispute-gated chat access. | `AdminKycTab`, `AdminClaimsTab`, `AdminChatReview` |
| `POST /api/request-withdrawal` | user | Atomically debits the wallet and files a pending withdrawal. | `ReferralDashboard.jsx:76` |
| `POST /api/cloudinary-sign` | user | Signed upload params scoped to `users/{uid}`; `type: private` for KYC. | `AddProperty`, `EditProfile`, `Account`, `KYCVerification` |
| `POST /api/admin-claim-webhook-transaction` | admin | Manually mark a stray TxnID claimed. | `AdminPanel.jsx:755` |
| `POST /api/approve-withdrawal` | admin | Approve/reject a withdrawal; refunds the wallet on reject. | **nothing** — orphaned |
| `POST /api/create-payment-intent` | user | Pre-computes an expected amount + reference code. | **nothing** — orphaned |
| `POST /api/verify-kyc` | user | Writes a `kycSubmissions` doc via Admin SDK. | **nothing** — superseded by a direct client write |
| `GET,POST /api/cron-rent-reminders` | `CRON_SECRET` | Idempotent rent-due notifications. | **nothing** — no cron is scheduled |

Eleven functions, against the Vercel Hobby limit of twelve. That ceiling is why
`api/admin.js` and `api/escrow.js` are `?action=`-dispatched routers rather than
separate files — a deliberate trade documented in each file's header.

### 4.3 Fee calculation

`api/_lib/feeCalculator.js` is the declared single source of truth. It reads
`platformConfig/fees` from Firestore and derives `expectedAmount` for each booking type:

| `bookingType` | Formula |
|---|---|
| `subscription` | `subscriptionMonthlyPrice × months` (months clamped 1–12) |
| `listing` | `listingFee` + (`onsiteVerificationFee` if requested) |
| `verification` | `standaloneVerificationFee`; caller must be the property owner |
| `deposit` | `property.securityDeposit` + `depositServiceFee` |
| `booking` | `property.rent` |

Frontend fee displays (`useFees`, `Pricing.jsx`, `AddProperty.jsx`) read the same
document but are explicitly **display-only**; the server never trusts a client amount.
`verify-payment.js` and `create-payment-intent.js` both call this module and are
forbidden by comment convention from defining local fee constants.

### 4.4 Admin SDK init

`api/_lib/firebase-admin.js` builds credentials from either
`FIREBASE_SERVICE_ACCOUNT_JSON` (base64) or the three `FIREBASE_ADMIN_*` vars,
normalising `\n` in the private key. It throws at module load if credentials are
missing, so a misconfigured deploy fails fast rather than NPE-ing at request time.
It also exports an `admin.firestore.{Timestamp,FieldValue}` shim so older call sites
keep working. `api/_lib/firebaseAdmin.js` (capital A) is a re-export shim;
`api/_lib/requireAdmin.js` is dead — nothing imports either.

---

## 5. Payment architecture

There is no card processor and no payment gateway callback. Bangladesh mobile-money
(bKash / Nagad / Rocket) is reconciled out-of-band:

```
 1. User pays the merchant number from their own bKash/Nagad/Rocket app.
 2. The merchant phone receives a confirmation SMS.
 3. An SMS-watcher app on that phone POSTs the SMS to /api/sms-webhook
    with a shared bearer secret.
 4. sms-webhook parses {transactionId, amount, provider} and writes
    unclaimed_transactions/{TXNID}  (doc id == TxnID ⇒ inherently idempotent)
    status: 'unclaimed' | 'suspicious'   (suspicious if amount ∉ [1, 100000])
 5. In the app, the user types their TxnID into PaymentModal.
 6. POST /api/verify-payment:
      a. reject any client-supplied amount/status field
      b. compute expectedAmount server-side via feeCalculator
      c. open a Firestore transaction on unclaimed_transactions/{TXNID}
      d. reject if already claimed / held / suspicious
      e. reject on provider mismatch
      f. amount check, three tiers:
           |diff| ≤ 1  BDT → approve
           |diff| ≤ 50 BDT → flagged_transactions + status 'held_for_review' → HTTP 202
           |diff| > 50 BDT → reject, HTTP 422
      g. atomically mark 'claimed' and apply business logic
```

Every state transition happens inside one `db.runTransaction`, with all reads issued
before any writes (a Firestore requirement the code calls out explicitly). Using the
TxnID as the document ID is the anti-replay cornerstone: a TxnID can be claimed exactly
once, ever.

**Business logic applied on a successful claim** (`applyBusinessLogic`,
`api/verify-payment.js:31`):

| `bookingType` | Effect |
|---|---|
| `subscription` | sets `subscriptionTier/Plan = 'Premium'` + expiry on the user |
| `listing` | `listingEntitlement += 1`; property → `paymentVerified: true, status: 'Pending'` |
| `verification` | property → `verificationStatus: 'pending'` |
| `booking` | creates `bookings/{id}` with `status: 'confirmed'` |
| `deposit` | creates `bookings/{id}` **and** `escrowDeposits/{id}` with `status: 'held'`; property → `Booked` |

All five paths additionally credit the payer's referrer, if any, into
`users/{referrerId}.referralWallet.available` and write a `commissions` record.

### 5.1 Escrow lifecycle

```
   deposit paid ──► held
                     ├─ tenant confirms ─┐
                     ├─ owner confirms  ─┴─► both ⇒ released
                     │                        (net of escrow fee → owner wallet,
                     │                         + transactions record)
                     ├─ either disputes ────► disputed  + disputes/{id} status 'open'
                     └─ admin override ─────► released | refunded
                                              (auto-resolves linked disputes)
```

Dual confirmation is required for the automatic release. Each confirmation writes an
immutable `escrowDeposits/{id}/confirmations/{auto}` sub-document. The escrow fee comes
from `escrowReleaseFee` / `escrowCommissionRate` in `platformConfig/fees`, with a
hardcoded 5% fallback and a sanity guard rejecting rates outside `[0, 1)` — a deliberate
defence against the 50% listing commission leaking into deposit releases.

Admin chat review (`api/admin.js:113`) is gated on an actual dispute existing: an admin
cannot read a conversation unless `disputes` has an open record for that booking or the
escrow is `disputed`. Both grants **and** denials are written to `adminAuditLogs`.

### 5.2 Referral & withdrawal

`users/{uid}.referralWallet = { available, withdrawn }`. Credits arrive from referral
commissions and from escrow releases. `POST /api/request-withdrawal` atomically checks
the balance, decrements `available`, increments `withdrawn`, and writes a `pending`
`withdrawals` doc, then notifies admins out-of-transaction. `POST /api/approve-withdrawal`
finalises it and, on reject, reverses both counters.

---

## 6. Data model

All collections are governed by `firestore.rules`, which ends in a
`match /{document=**} { allow read, write: if false; }` catch-all — any collection not
listed below is unreachable from the client.

| Collection | Client writes? | Notes |
|---|---|---|
| `users/{uid}` | self-update, minus a blocked-field set | Blocked from self-service: `admin`, `subscriptionTier`, `subscriptionPlan`, `subscriptionExpiry`, `listingEntitlement`, `referralWallet`. |
| `properties/{id}` | owner create/update/delete | Owner cannot self-approve, cannot flip `isApproved`, cannot reach `status: 'Available'` without `isApproved: true`. Public read requires `isApproved == true`. |
| `platformConfig/fees` | admin only | World-readable (pricing is public). `history/` subcollection is append-only. |
| `payments` | **no** | Admin SDK only. Read by owner (`uid`) or admin. |
| `unclaimed_transactions` | **no** | Not even readable by the paying user — reading it would let anyone enumerate claimable TxnIDs. |
| `flagged_transactions` | **no** | Near-miss amounts awaiting admin review. |
| `paymentIntents` | **no** | Backend-created, owner-readable. |
| `escrowDeposits` | **no** | Tenant + owner read. `confirmations/` subcollection. |
| `bookings` | **no** | Tenant + owner read. |
| `commissions` | **no** | Referrer read. |
| `withdrawals` | **no** | Requester read. |
| `kycSubmissions` | **no** (rules) | See [SECURITY.md H-2](SECURITY.md#h-2-kyc-submission-is-blocked-by-its-own-rules). |
| `adminAuditLogs` | **no** | Admin read. Append-only from the Admin SDK. |
| `referrals` | **no** | Referrer read. |
| `tenantMoveIns` | tenant create; both parties update | |
| `viewing_requests` | tenant create; both parties update | |
| `conversations` + `messages/` | participants only | `participants.size() == 2` enforced on create; `senderId == auth.uid` on message create. Messages are immutable to clients (`update, delete: if isAdmin()`). |
| `notifications` | any signed-in user can create **for another user** | Owner may update only `isRead`. See [SECURITY.md M-1](SECURITY.md#m-1-any-user-can-write-an-arbitrary-notification-to-any-other-user). |
| `enquiries` | tenant create | |
| `reports` | signed-in create with `reporterId == auth.uid` | Admin-read only. |
| `propertyReviews`, `ownerReviews` | reviewer create/update/delete | Publicly readable; rating constrained 1–5. |

`firestore.indexes.json` is **empty** (`{"indexes": [], "fieldOverrides": []}`). The
codebase compensates by sorting in memory — e.g. `subscribeToConversations` fetches by
`array-contains` and sorts client-side "to avoid requiring a composite index"
(`src/utils/messageService.js:102`). This works at current data volume and will not
scale.

---

## 7. Media pipeline

1. Client `POST /api/cloudinary-sign` with its Firebase ID token.
2. The server signs `{timestamp, folder: "users/{uid}"}` — the folder is derived from
   the verified token, never from the request body, so a user cannot write into another
   user's folder.
3. For KYC (`isKyc: true`) the signature additionally pins `type: 'private'` so the
   asset is not publicly addressable.
4. Client uploads directly to `api.cloudinary.com` with the returned signature.
5. Only the resulting `public_id` / URL is stored in Firestore.

The Cloudinary API secret never leaves the server. Firebase Storage is initialised in
`src/firebase.js` but unused — all media goes through Cloudinary.

---

## 8. Cross-cutting utilities

- **`src/utils/logger.js`** — dev-only `info`/`debug`/`warn`; `error` always runs and
  calls a `captureError` stub that is wired to nothing. Sentry/Datadog integration is a
  TODO. **There is currently no production error reporting at all.**
- **`src/utils/safeQuery.js`** — intended guard forcing a `.limit()` on every Firestore
  query. Referenced by nothing, and depends on `QUERY_LIMITS.HARD_CAP`, which does not
  exist (see [SECURITY.md H-4](SECURITY.md#h-4-query_limitshard_cap-is-undefined-and-is-passed-to-limit)).
- **`src/config/queryLimits.js`** — per-surface result caps, used directly at call sites.
- **`src/utils/api.js`** — returns relative `/api/...` on web, absolute
  `VITE_API_BASE_URL` (default `https://anylet.com`) under Capacitor, where relative
  paths would resolve to the native `localhost` origin.
- **`src/utils/messageService.js`** — conversation/message CRUD, `DOMPurify`-sanitized
  on write.
- **`src/utils/emailService.js`, `src/utils/otp.js`** — both hold placeholder EmailJS
  credentials (`service_xxxxxx`). Email is **not** wired up; `emailService` detects the
  placeholder and returns `{ simulated: true }`, `otp.js` does not and will throw.

---

## 9. Feature flags

`src/config/featureFlags.js` exports `IS_BETA = true`. While set:

- The 49 BDT listing fee renders as "Free (Beta)".
- `AddProperty` skips `PaymentModal` entirely and writes the property straight to
  Firestore with `isApproved: true, status: 'Available', listingPaymentId: 'BETA_FREE'`.
- `BetaLock` blurs and locks not-yet-shipped surfaces.

The paid path (`handlePaymentSubmitted`) is preserved intact below the beta path and
reactivates when the flag flips. **The beta write is rejected by the current
`properties` create rule** — see [SECURITY.md H-1](SECURITY.md#h-1-the-active-beta-listing-flow-is-rejected-by-the-properties-create-rule).

---

## 10. Build & deploy

```
npm run dev      # concurrently: dev-api-server.mjs (:3001) + vite (:5174, proxying /api)
npm run build    # vite build → dist/
npm run preview
npm run lint
npm run test:rules   # requires: firebase emulators:start --only firestore  (port 9090)
npm run cap:android / cap:ios
```

Production is Vercel, deployed on push. `vercel.json` carries only two rewrites — no
headers block, no cron block, no function config. There is **no CI**: no GitHub Actions,
no pre-commit hooks, no automated test or lint gate.

`dev-api-server.mjs` mirrors the Vercel functions locally through the same
`withMiddleware` wrapper, but currently registers exactly one route
(`/api/cloudinary-sign`). Every other endpoint 404s in local dev.

Native builds are Capacitor 8 shells over the same `dist/`; `capacitor.config.json`
points the webview at the deployed origin.

---

## 11. Known architectural debt

Ranked by how much it will hurt.

1. **Two admin surfaces.** `AdminPanel.jsx` (2027 lines, legacy, route
   `/admin/*`) and `src/pages/admin/*` (new, route `/admin`). The migration stalled
   partway; `App.jsx:245` keeps the legacy panel as a catch-all fallback. Feature work
   currently has to guess which one to touch.
2. **Admin writes bypass the API.** `AdminPanel.jsx` performs ~20 privileged Firestore
   writes directly from the browser — including to `payments` and `escrowDeposits`,
   which `firestore.rules` marks `allow write: if false`. Those calls cannot succeed.
   See [SECURITY.md H-5](SECURITY.md#h-5-admin-ui-writes-directly-to-backend-only-collections).
3. **No composite indexes.** Sorting and multi-field filtering is done in memory.
   Ceiling is low.
4. **No observability.** `logger.error` in production goes nowhere. No Sentry, no
   structured logs, no alerting on the payment path — the one place silent failure is
   most expensive.
5. **Four orphaned endpoints** (`approve-withdrawal`, `create-payment-intent`,
   `verify-kyc`, `cron-rent-reminders`) still deployed and reachable, each consuming one
   of the twelve Hobby function slots.
6. **`referralWallet` is overloaded.** It is simultaneously the referral ledger and the
   escrow payout account (`api/escrow.js:114`, `:270`) and the refund account
   (`api/escrow.js:282`). One field, three unrelated money flows, no per-flow audit
   trail on the balance itself.
7. **Dead code.** `RoleRoute.jsx`, `safeQuery.js`, `api/_lib/requireAdmin.js`,
   `api/_lib/firebaseAdmin.js`, `src/testWrite.js`, `mobile/`, `zip/`, and ~20 loose
   root scratch files.
8. **233 ESLint errors** across `src/` and `api/`. Lint is not enforced anywhere.
9. **Test coverage is 4 rules assertions.** No component tests, no API tests, no
   payment-path tests. The money path is entirely unverified by automation.
