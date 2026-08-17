# AnyLet — Backend Audit Report

**Branch audited:** `chore/codebase-rehab` (commit `9aa833f`)
**Date:** August 17, 2026
**Scope:** API endpoints, Firebase client config, Firestore rules, Vercel infrastructure, supporting utilities

---

## 1. Branch Topology — How the Branches Actually Work

### The Problem: Massive Divergence

```
main                chore/codebase-rehab
 │                        │
 │  ffbd421 fix(MyListings)   ← HEAD of main
 │  ...                      │
 │  bfdd708 remove payment    │
 │  ...                      │
 │                           9aa833f fix(security)  ← HEAD of codebase-rehab
 │                           505efe6 refactor Account.jsx
 │                           ...
 │                           d9989cb fix: browser process.env bug
 │
 │  ◀── 17 commits on main NOT in codebase-rehab ──▶
 │  ◀── 16 commits on codebase-rehab NOT in main ──▶
 │
 │  Total: 114 files changed, +14,104 / -17,863 lines
```

**What happened:** Claude created two parallel work streams that were never reconciled:

| Branch | What it did | Current state |
|---|---|---|
| `main` | Post-rehab feature work: removed payment flow from AddProperty, drag-and-drop images, status/isApproved sync fixes, amenity restoration | 17 commits ahead of codebase-rehab |
| `chore/codebase-rehab` | Backend hardening, component decomposition, dead code removal, middleware/security cleanup, Firestore rules rewrite | 16 commits ahead of main |

**Key insight:** The `claude/project-instruction-context-692676` branch attempted a merge (`2c8f618`) but it was incomplete — it merged codebase-rehab INTO that branch, then `main` continued to receive new commits that never went back into codebase-rehab.

**Result:** `main` has critical UI fixes (payment removal, status sync) that `codebase-rehab` does NOT have, and `codebase-rehab` has the entire security/middleware/backend rewrite that `main` does NOT have. They are effectively two different applications now.

---

## 2. Backend Architecture Overview

### 2.1 Infrastructure Stack

```
┌──────────────────────────────────────────────────┐
│  Vercel (Production Host)                         │
│  ├── 12 Serverless Functions in /api/             │
│  ├── Vercel Cron: /api/cron-rent-reminders        │
│  └── Rewrites: /api/* → serverless, /* → index    │
├──────────────────────────────────────────────────┤
│  Firebase                                         │
│  ├── Cloud Firestore (database)                   │
│  ├── Firebase Auth (client-side JWT)               │
│  ├── Firebase Admin SDK (server-side)             │
│  ├── Firebase Storage (images via Cloudinary)      │
│  └── App Check (reCAPTCHA Enterprise)              │
├──────────────────────────────────────────────────┤
│  External Services                                │
│  ├── Cloudinary (image hosting + signing)         │
│  ├── Upstash Redis (rate limiting, optional)      │
│  ├── bKash / Nagad / Rocket (MFS payments)       │
│  └── SMS Watcher (webhook → sms-webhook.js)       │
└──────────────────────────────────────────────────┘
```

### 2.2 API Function Map (12 endpoints)

| File | Method | Auth | Admin | Purpose |
|---|---|---|---|---|
| `admin.js` | POST | ✅ | ✅ | KYC review, set admin claims, chat review |
| `admin-claim-webhook-transaction.js` | POST | ✅ | ✅ | Admin manually claims a transaction |
| `approve-withdrawal.js` | POST | ✅ | ✅ | Approve/reject withdrawal requests |
| `cloudinary-sign.js` | POST | ✅ | ❌ | Generate Cloudinary upload signature |
| `create-payment-intent.js` | POST | ✅ | ❌ | Create payment intent before MFS payment |
| `cron-rent-reminders.js` | GET/POST | ❌ (cron secret) | ❌ | Send rent-due reminders |
| `escrow.js` | POST | ✅ | ❌ (per-action) | Confirm/dispute/admin-action on escrow |
| `request-withdrawal.js` | POST | ✅ | ❌ | User requests wallet withdrawal |
| `sms-webhook.js` | GET/POST/PUT/PATCH | ❌ (webhook secret) | ❌ | Receives MFS SMS → stores unclaimed txn |
| `verify-kyc.js` | POST | ✅ | ❌ | Submit KYC documents for review |
| `verify-payment.js` | POST | ✅ | ❌ | Verify MFS transaction, apply business logic |
| — | — | — | — | **Total: 11 functions** (within Hobby 12-function limit) |

### 2.3 Shared Libraries (`api/_lib/`)

| File | Purpose |
|---|---|
| `firebase-admin.js` | Firebase Admin SDK init with dual credential loading (base64 JSON or individual env vars) |
| `middleware.js` | CORS, rate limiting (Redis + memory fallback), body limits, auth verification, XSS sanitization, security headers |
| `feeCalculator.js` | Single source of truth for all fee computations — reads from `platformConfig/fees` |
| `requireAdmin.js` | **DEAD CODE** — standalone auth helper, never imported by any endpoint |

---

## 3. Critical Issues

### 🔴 CRITICAL-1: `safeQuery.js` Uses Internal Firebase SDK Properties (Will Break)

**File:** `src/utils/safeQuery.js:34-35`
**Severity:** Critical — app will crash when Firebase SDK updates

```js
const hasLimit = q._query && q._query._limit !== null && q._query._limit !== undefined;
```

This accesses `_query._limit`, which is an **internal, undocumented Firebase SDK property**. It works today but will break silently on any Firebase SDK minor update. There is no public API to inspect whether a query already has a `.limit()` clause.

**Recommendation:** Remove the inspection logic entirely. Require callers to always pass an explicit limit (the `explicitLimit` parameter). If they don't, always apply the hard cap — no need to check if one already exists.

---

### 🔴 CRITICAL-2: `notificationService.js` Field Mismatch With Firestore Rules

**File:** `src/utils/notificationService.js:22-31`
**Severity:** Critical — notifications will be rejected by Firestore rules

The client-side `createNotification()` writes:
```js
{
  userId, type, title,
  message,    // ← this field
  link,
  isRead: false,
  createdAt: serverTimestamp(),
  metadata
}
```

But the Firestore rules (`firestore.rules:301-312`) lock the schema to:
```js
request.resource.data.keys().hasOnly(
  ['userId', 'type', 'title', 'message', 'link', 'isRead', 'createdAt', 'metadata']
)
```

The field name matches, BUT the rules also require:
- `request.resource.data.userId != request.auth.uid` (cannot notify yourself)
- `request.resource.data.keys().hasAll(['userId', 'type', 'title'])` (missing `title` would fail)

The bigger issue: if `createNotification()` is called with `userId === currentUser.uid` (e.g., "notify myself that my listing was approved"), the Firestore rule **rejects it**. Several legitimate flows may need self-notifications. The backend endpoints (verify-payment, approve-withdrawal) write notifications via Admin SDK which bypasses rules, so they work. But any client-side call to `createNotification` for the current user will silently fail.

---

### 🔴 CRITICAL-3: `verify-payment.js` Calls `getPlatformFees()` Inside a Transaction

**File:** `api/verify-payment.js:166`
**Severity:** Critical — Firestore transaction will fail intermittently

```js
// Inside applyBusinessLogic(), which is called inside db.runTransaction()
const feesData = await getPlatformFees();  // This is a separate Firestore READ outside the transaction context
```

Firestore transactions have strict rules: all reads must happen through the transaction object (`tx.get()`). Calling `getPlatformFees()` performs an independent `db.collection('platformConfig').doc('fees').get()` outside the transaction. While this won't crash, it means the fee data could be stale or inconsistent with the transaction's snapshot, and it **violates Firestore's documented transaction patterns**. On high contention or during reads that need consistency guarantees, this can cause subtle bugs.

**Fix:** Either pass the fees object from the initial `computeExpectedAmount()` call (it already fetches fees), or read through `tx.get()`.

---

### 🟡 HIGH-1: `dev-api-server.mjs` Only Registers ONE Endpoint

**File:** `dev-api-server.mjs`
**Severity:** High — local development is broken for 10 out of 11 endpoints

Only `cloudinary-sign` is registered:
```js
app.post('/api/cloudinary-sign', vercelAdapter(cloudinarySignHandler));
```

All other 10 endpoints (admin, verify-payment, escrow, etc.) return 404 locally. Developers testing locally will think the backend is broken. The `npm run dev` script starts this server alongside Vite, but it only proxies cloudinary-sign calls.

**This means:** The entire payment flow, escrow, KYC, withdrawal, admin, and cron endpoints are **untestable locally**. You must deploy to Vercel to test them.

---

### 🟡 HIGH-2: Duplicate Auth Logic — `requireAdmin.js` is Dead Code

**File:** `api/_lib/requireAdmin.js`
**Severity:** Medium — dead code, maintenance trap

This file exports `requireAdmin()` and `requireAuth()` functions. However, **no API endpoint imports this file**. Every endpoint uses `withMiddleware()` from `middleware.js` which has its own `attachAuth()` function. The standalone file is a leftover from before middleware was unified.

Additionally, `middleware.js`'s `attachAuth()` does NOT import from `requireAdmin.js` — it has its own inline JWT verification. So there are now **three separate implementations** of auth checking:
1. `middleware.js:attachAuth()` — actively used by all endpoints
2. `requireAdmin.js:requireAdmin()` — dead code
3. `requireAdmin.js:requireAuth()` — dead code

---

### 🟡 HIGH-3: `cloudinary-sign.js` Missing VITE Fallback (Fixed on main, NOT on codebase-rehab)

**File:** `api/cloudinary-sign.js`
**Severity:** Medium — will fail if Vercel env vars are misconfigured

On `main`, commit `9a174e6` added a fallback:
```js
cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
```

This branch does NOT have that fallback. It only reads `process.env.CLOUDINARY_CLOUD_NAME`. If only the VITE_ prefixed env var is set (which is the pattern used for client-side vars), the signing endpoint will use `undefined` as the cloud name, producing invalid signatures.

---

### 🟡 HIGH-4: `escrow.js` Firestore Transaction Uses `get()` Without `where()` Clause

**File:** `api/escrow.js:248-252`
**Severity:** Medium — will throw Firestore error

```js
const disputesSnap = await tx.get(
  db.collection('disputes')
    .where('bookingId', '==', bookingId)
    .where('status', '==', 'open')
);
```

Firestore transactions require that queries with `where()` clauses **must have a matching composite index**. There is no composite index defined in `firestore.indexes.json` for `disputes` collection group. This query will fail with a "FAILED_PRECONDITION" error the first time it's executed, because no composite index exists for `(bookingId ASC, status ASC)` on the `disputes` collection.

---

## 4. Medium Issues

### 🟠 MEDIUM-1: Firestore Rules — `users/{uid}` allows public read

**File:** `firestore.rules:55`
```js
allow read: if true;
```

Any unauthenticated user can read any user's profile document. This includes email addresses, phone numbers, KYC status, referral wallet balances, and admin claims. For a production app handling financial transactions, this is a privacy concern.

---

### 🟠 MEDIUM-2: Firestore Rules — Missing `disputes` and `transactions` Collections

**File:** `firestore.rules`
**Severity:** Medium — writes will fail

The rules file does not define match blocks for:
- `disputes/{disputeId}` — created by `escrow.js` via Admin SDK (bypasses rules, OK)
- `transactions/{txnId}` — created by `escrow.js` via Admin SDK (OK)

Since the catch-all denies everything, **client-side reads** of disputes or transactions will fail. This is intentional (backend-only writes), but there's no read path for users to view their own disputes — which the frontend might need.

---

### 🟠 MEDIUM-3: `verify-payment.js` Listings Payment Still Requires MFS Transaction

**Severity:** Medium — business logic conflict with `main` branch

On `main` (commit `bfdd708`), the payment flow was completely removed from AddProperty — posting is now free, and the publish button submits directly to verification. But on `codebase-rehab`, `verify-payment.js` still has the `listing` booking type with full payment logic:

```js
} else if (bookingType === 'listing') {
    tx.update(db.collection('users').doc(uid), {
      listingEntitlement: FieldValue.increment(1),
      ...
    });
```

When these branches are merged, this code becomes dead/unused. It's not a bug on this branch alone, but it will create confusion during merge.

---

### 🟠 MEDIUM-4: `cron-rent-reminders.js` Reads Documents One-by-One Inside a Loop

**File:** `api/cron-rent-reminders.js:62`
```js
for (const docSnap of moveInsSnap.docs) {
  ...
  const notificationDoc = await notificationRef.get();  // N+1 reads
```

For each active move-in, it does a separate Firestore read to check if the notification already exists. With 100 move-ins (the limit), this is up to 100 sequential reads. On Vercel's serverless execution timeout (10s for Hobby), this could time out.

**Fix:** Batch all reads before the loop, or use the notification ID as the document ID and rely on `set()` with `{ merge: true }` (idempotent write without read).

---

### 🟠 MEDIUM-5: `request-withdrawal.js` Admin Notification Uses Wrong Query

**File:** `api/request-withdrawal.js:115-118`
```js
const adminsSnap = await db.collection('users')
  .where('role', '==', 'admin')
  .limit(10)
  .get();
```

This queries the `users` collection for `role == 'admin'`. But the admin system uses Firebase Custom Claims (`admin: true`), not a Firestore field. The `set-claim` handler in `admin.js` only sets the custom claim — it does NOT write a `role` field to the user document:

```js
await auth.setCustomUserClaims(targetUid, {
  admin: grantAdmin,
  role: grantAdmin ? 'admin' : 'user',  // Only in custom claims, NOT in Firestore
});
```

The `role` field might exist in user documents if it was set during initial account creation, but there's no guarantee. If no user document has `role: 'admin'`, withdrawal notifications to admins will silently fail.

---

### 🟠 MEDIUM-6: `middleware.js` CSP Blocks Inline Styles Used by Tailwind

**File:** `api/_lib/middleware.js:60`
```js
res.setHeader('Content-Security-Policy', "... style-src 'self' 'unsafe-inline'; ...");
```

The CSP allows `unsafe-inline` styles, which is fine for Tailwind. However, it also sets `script-src 'self' 'unsafe-inline'` which is intentionally permissive but weak. The `connect-src` directive lists only Google/Firebase domains but doesn't include `https://api.cloudinary.com` — if any frontend code tries to call Cloudinary API directly (instead of going through the signing endpoint), it will be blocked.

---

### 🟠 MEDIUM-7: Firebase Client Exposes App Check Debug Token in Source

**File:** `src/firebase.js:29-31`
```js
if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
```

Setting `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` bypasses App Check entirely in development. This is intentional for dev, but `import.meta.env.DEV` is `false` in Vite preview builds (`vite preview`), which are often used for staging. If someone deploys a preview without setting production App Check, the debug bypass won't activate and App Check will fail.

---

## 5. Low Issues / Code Quality

### 🟢 LOW-1: `seed_fees.js` Uses BDT Cents, Frontend Uses BDT

The fee config stores values like `listingFee: { value: 49 }` — is this 49 BDT or 49 poisha (0.49 BDT)? The `computeExpectedAmount()` function treats them as whole BDT. The seed script sets `subscriptionMonthlyPrice: { value: 999 }` which is clearly whole BDT. No unit inconsistency, but the lack of documentation about currency units could cause confusion.

### 🟢 LOW-2: Mixed Import Styles for `Timestamp` and `FieldValue`

Some files import from `firebase-admin/firestore`:
```js
import { Timestamp } from 'firebase-admin/firestore';  // escrow.js, sms-webhook.js
```

Others import from the `admin` shim:
```js
admin.firestore.Timestamp.now();  // admin.js, approve-withdrawal.js, request-withdrawal.js
```

Both work, but the shim exists for backward compatibility. New code should import directly from `firebase-admin/firestore`.

### 🟢 LOW-3: `logger.js` Swallows All Production Errors

In production (`IS_PROD = true`), `logger.error()` calls `captureError()` which is a no-op:
```js
function captureError(context, err) {
    void context;  // TODO: wire to Sentry / Datadog
    void err;
}
```

**All production errors are silently swallowed.** If a backend endpoint logs an error, it goes nowhere. This means debugging production issues is impossible without Vercel function logs.

### 🟢 LOW-4: Vercel `vercel.json` Has Unnecessary Rewrite

```json
{ "source": "/api/(.*)", "destination": "/api/$1" }
```

This rewrite is unnecessary on Vercel — it automatically routes `/api/*` to the `api/` directory. The rewrite is a no-op at best and could cause double-routing issues at worst.

### 🟢 LOW-5: `package.json` Name Mismatch

```json
"name": "rentalproject"
```

The package is called "rentalproject" but the app is "AnyLet". This is cosmetic but confusing for anyone looking at `package-lock.json` or npm output.

---

## 6. Firestore Rules Assessment

### What's Well Done ✅
- **Catch-all deny**: `match /{document=**} { allow read, write: if false; }` prevents accidental exposure of new collections
- **Payment isolation**: `payments`, `unclaimed_transactions`, `flagged_transactions` are write-locked to Admin SDK only
- **Property ownership**: Users can only create/edit properties with their own `ownerId`, cannot self-approve
- **Review deduplication**: Deterministic review IDs (`uid_propertyId`) enforced at the rules level
- **Notification schema lock**: Limits fields, sizes, and prevents self-notification spam
- **Withdrawal balance protection**: Users cannot write to `withdrawals` — backend-only

### What's Missing ⚠️
- `disputes` collection — no rules defined (backend-only writes work, but no client reads)
- `transactions` collection — same issue
- `favorites` / `savedProperties` — if these exist, they have no rules and are blocked by catch-all
- Composite indexes for `disputes` collection queries used in `escrow.js`

---

## 7. Security Assessment

### Strong Points 🔒
1. **SMS webhook authentication**: Uses constant-time comparison (`crypto.timingSafeEqual`) with a minimum 16-char secret
2. **Rate limiting**: Redis-backed with memory fallback, 30 req/min
3. **XSS sanitization**: All POST payloads sanitized via `sanitize-html` with ALL tags stripped
4. **Anti-replay**: Transaction IDs are claimed atomically — double-claim returns 409
5. **Fee calculation**: Entirely server-side via `feeCalculator.js` — client cannot influence amounts
6. **Body size limits**: Enforced at middleware level (2-10kb depending on endpoint)
7. **Security headers**: HSTS, X-Frame-Options DENY, CSP, nosniff all set
8. **Client field rejection**: `verify-payment.js` and `create-payment-intent.js` reject any client-supplied amount/status fields

### Weak Points 🔓
1. **Public user profiles** (`allow read: if true` on `users/{uid}`)
2. **No CORS origin validation for API-only calls** — the middleware allows Vercel preview deployments via regex, which is correct but broad
3. **Cron secret uses `safeEqual` but checks `authHeader` not `authHeader.slice(7)`** — actually this IS correct since it compares `authHeader` with `"Bearer ${cronSecret}"` including the "Bearer " prefix

---

## 8. Branch Merge Strategy Recommendation

### The Situation
- `main` has **17 commits** of active feature work that `codebase-rehab` lacks
- `codebase-rehab` has **16 commits** of backend hardening that `main` lacks
- Total: **114 files changed**, massive conflict potential

### Recommended Approach

1. **DO NOT merge codebase-rehab into main directly** — the component decomposition on codebase-rehab deleted/rewrote many files that main has since modified

2. **Cherry-pick the backend-specific commits** from codebase-rehab onto main:
   - `d9989cb` — fix: browser process.env bug in safeQuery, dedupe map key
   - `d3db9a4` — security(rules): harden notifications create against spam/phishing
   - `647b552` — fix(cron): schedule rent reminders + constant-time secret compare
   - `e3b011e` — security(rules): enforce one-review-per-user at rules layer
   - `9aa833f` — fix(security): stop serving internal audit report publicly
   - The entire `api/_lib/` directory and all `api/*.js` files

3. **Keep the frontend decomposition** from codebase-rehab as a separate effort — the deleted UI components on codebase-rehab conflict with the new features on main

4. **Rebase main onto a clean state**, then cherry-pick backend changes

### What Main Needs From codebase-rehab (Priority Order)

| Priority | What | Why |
|---|---|---|
| P0 | `api/_lib/middleware.js` | Security hardening (rate limit, XSS, CORS, body limits) |
| P0 | `api/_lib/firebase-admin.js` | Robust credential loading |
| P0 | `api/_lib/feeCalculator.js` | Single source of truth for fees |
| P0 | `firestore.rules` | Comprehensive security rules |
| P0 | `api/sms-webhook.js` | Constant-time secret comparison, sanity bounds |
| P0 | `api/verify-payment.js` | ACID transactions, anti-replay, tiered amount check |
| P1 | `api/escrow.js` | Unified escrow endpoint |
| P1 | `api/create-payment-intent.js` | Server-side fee computation |
| P1 | `api/request-withdrawal.js` | Atomic balance deduction |
| P1 | `api/approve-withdrawal.js` | Admin withdrawal management |
| P1 | `api/admin.js` | Unified admin endpoint |
| P1 | `api/cron-rent-reminders.js` | Idempotent rent reminders |
| P1 | `api/cloudinary-sign.js` | Needs VITE_ fallback added |
| P2 | `src/utils/logger.js` | Needs Sentry wired up |
| P2 | `src/utils/safeQuery.js` | Remove internal SDK property access |
| P2 | `src/config/queryLimits.js` | Good pattern, keep as-is |

---

## 9. Summary Scorecard

| Category | Score | Notes |
|---|---|---|
| **API Design** | 8/10 | Clean unified routers, consistent error handling, proper HTTP status codes |
| **Security** | 7/10 | Strong webhook auth, rate limiting, XSS sanitization. Weakened by public user reads |
| **Firestore Rules** | 8/10 | Excellent coverage, catch-all deny. Missing disputes/transactions collections |
| **Infrastructure** | 5/10 | Dev server only proxies 1 endpoint, production logger is a no-op, missing composite index |
| **Code Quality** | 6/10 | Dead `requireAdmin.js`, mixed import styles, internal SDK property usage |
| **Branch Health** | 3/10 | Massive divergence, 114 files changed, no clear merge path |
| **Documentation** | 7/10 | Good inline comments, ARCHITECTURE.md exists. Missing API docs |
| **Overall Backend Health** | **6.3/10** | Solid foundation with critical fixups needed before merge |

---

*Report generated by full-stack codebase audit on `chore/codebase-rehab` branch.*
