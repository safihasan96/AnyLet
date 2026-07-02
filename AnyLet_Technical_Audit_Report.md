# 🔍 AnyLet Web — Deep Technical Audit Report
**Auditor:** Senior Software Architect / AI Pair Reviewer  
**Date:** June 2026  
**Codebase:** `/Users/safihasan/Desktop/AnyLet Web`  
**Verdict Summary:** Production-adjacent MVP with solid foundations but several **critical security, logic, and reliability bugs** that must be fixed before full public launch.

---

## PHASE 1 — CODEBASE MAPPING

### 1.1 Project Structure

```
AnyLet Web/
├── api/                          ← Vercel Serverless Functions (Node.js backend)
│   ├── _lib/
│   │   ├── firebaseAdmin.js      ← Admin SDK init (lazy singleton)
│   │   └── requireAdmin.js       ← Auth middleware (requireAdmin, requireAuth)
│   ├── cloudinary-sign.js        ← Signed upload endpoint (POST, auth required)
│   ├── cron-rent-reminders.js    ← Pseudo-cron (unprotected, uses legacy admin init)
│   ├── process-payment-webhook.js← SMS-to-payment auto-verify (bKash/Nagad)
│   ├── set-admin-claim.js        ← Grant/revoke Firebase admin custom claims
│   └── verify-kyc.js             ← Simulated NID verification (Porichoy mock)
├── src/
│   ├── App.jsx                   ← Root router (React Router v7, lazy chunks)
│   ├── main.jsx                  ← Entry point (providers, ErrorBoundary, PWA SW)
│   ├── firebase.js               ← Firebase init (Auth, Firestore, Storage, Analytics)
│   ├── contexts/                 ← AuthContext, ThemeContext, LanguageContext, ToastContext
│   ├── components/               ← 40+ reusable UI components
│   ├── pages/                    ← 45 page components (all lazy-loaded)
│   ├── utils/                    ← emailService, messageService, notificationService, commissionService, referral, otp
│   ├── hooks/                    ← useFirestoreSnapshot, useInfiniteScroll, useSavedProperties, useReferral
│   ├── data/                     ← BD location data, translations
│   └── config/queryLimits.js     ← Firestore query caps
├── firestore.rules               ← Firestore security rules
├── vite.config.js                ← Vite + PWA + manual chunking config
├── vercel.json                   ← Vercel deployment config
└── .env.local                    ← Runtime secrets (VITE_* vars)
```

**Entry Points:**
- `src/main.jsx` — React app root (renders into `#root`)
- `api/*.js` — Vercel serverless functions, each file = one endpoint

**Config Files Present:**
- `vite.config.js` ✅ | `firestore.rules` ✅ | `firebase.json` ✅
- `capacitor.config.json` ✅ | `vercel.json` ✅ | `.env.local` ✅
- No `docker`, no `CI/CD` pipelines detected anywhere. Deployment is Vercel-only via git push.

---

### 1.2 Tech Stack Inventory

| Layer | Library | Version | Status |
|---|---|---|---|
| UI Framework | React | 19.2.0 | ✅ Latest stable |
| Build Tool | Vite | 7.3.1 | ✅ Latest |
| Routing | React Router DOM | 7.13.1 | ✅ |
| Styling | Tailwind CSS | 4.2.1 | ✅ |
| Animation | Framer Motion | 12.38.0 | ✅ |
| BaaS | Firebase | 12.9.0 | ✅ |
| Mapping | Leaflet + React-Leaflet | 1.9.4 | ✅ |
| Mobile | Capacitor | 8.2.0 | ✅ |
| Image CDN | Cloudinary REST | – | ⚠️ unsigned preset exposed |
| Email | EmailJS | 4.4.1 | 🔴 keys are stub/dummy |
| Icons | Lucide React | 0.575.0 | ✅ |
| SEO | React Helmet Async | 3.0.0 | ✅ |
| PWA | vite-plugin-pwa | 1.2.0 | ✅ |

**No testing library detected.** No `jest`, `vitest`, `cypress`, or `playwright` anywhere in `package.json`. Zero automated tests.

---

### 1.3 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      CLIENT (React SPA)                          │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐  │
│  │  Pages   │→ │  Contexts │→ │  Firebase │→ │   Firestore   │  │
│  │ (45 lazy)│  │Auth/Toast │  │  Web SDK  │  │  (NoSQL DB)   │  │
│  └──────────┘  └───────────┘  └───────────┘  └───────────────┘  │
│                               ↓                                  │
│                        Firebase Auth / Storage                   │
└──────────────────────────────────────────────────────────────────┘
              ↓ Vercel Serverless (POST to /api/*)
┌──────────────────────────────────────────────────────────────────┐
│                   SERVERLESS BACKEND (Node.js)                   │
│  cloudinary-sign  |  set-admin-claim  |  verify-kyc             │
│  process-payment-webhook  |  cron-rent-reminders                 │
│                         ↓                                        │
│                  Firebase Admin SDK → Firestore                  │
└──────────────────────────────────────────────────────────────────┘
              ↓ Passive (read-only for image hosting)
┌────────────────────┐    ┌───────────────────────────────────────┐
│   Cloudinary CDN   │    │  Android SMS Watcher (external app)   │
└────────────────────┘    └───────────────────────────────────────┘
```

**Pattern:** Client-Serverless hybrid. Most logic lives in the browser; sensitive operations run in Vercel functions with Firebase Admin SDK. Security relies almost entirely on `firestore.rules`.

---

## PHASE 2 — FEATURE AUDIT

### 2.1 Implemented Features (Working)

| Feature | Files | Status |
|---|---|---|
| Email/Password Auth | `Signup.jsx`, `Login.jsx`, `AuthContext.jsx` | ✅ Working |
| Google OAuth (with account linking) | `AuthContext.jsx`, `Login.jsx` | ✅ Solid implementation |
| Onboarding Pipeline | `Onboarding.jsx`, `OnboardingGuard.jsx` | ✅ |
| Property Listing (Create/Edit/Delete) | `AddProperty.jsx`, `MyListings.jsx` | ✅ |
| Property Search + Map | `Search.jsx`, `MapPage.jsx`, `PropertyMap.jsx` | ✅ |
| Property Details + Image Gallery | `PropertyDetails.jsx` | ✅ |
| Viewing Request System | `ViewingRequestModal.jsx`, `PropertyDetails.jsx`, `Inbox.jsx` | ✅ |
| Real-time Messaging | `ConversationDetail.jsx`, `messageService.js`, `Inbox.jsx` | ✅ Solid |
| Notifications | `Notifications.jsx`, `notificationService.js` | ✅ |
| Referral System | `ReferralDashboard.jsx`, `commissionService.js`, `referral.js` | ✅ |
| Payment via SMS Watcher | `process-payment-webhook.js`, `PaymentModal.jsx` | ✅ (bKash/Nagad only) |
| Escrow / Booking | `BookPropertyModal.jsx`, `process-payment-webhook.js` | ✅ |
| KYC (NID Verification) | `verify-kyc.js` | 🟡 SIMULATED (mock only) |
| Admin Panel | `AdminPanel.jsx` (127KB!) | ✅ Very feature-rich |
| PWA / Install Prompt | `vite-plugin-pwa`, `InstallPrompt.jsx` | ✅ |
| Dark Mode | `ThemeContext.jsx` | ✅ |
| Internationalization | `LanguageContext.jsx`, `translations.js` | ✅ (basic) |

### 2.2 Partial / Incomplete Features

**1. KYC Verification — `api/verify-kyc.js` — ~20% complete**
- The entire body (lines 33–45) is a mock: `await new Promise(resolve => setTimeout(resolve, 1500))`. It validates NID digit length, not the actual NID.
- The Porichoy API is never called.
- Writes `provider: 'porichoy_mock'` directly to Firestore, giving users a "verified" badge they did not earn.
- **Missing:** Real API call, proper error handling, PII encryption for stored NID numbers.

**2. Email Notification Service — `src/utils/emailService.js` — ~5% complete**
- `EMAILJS_SERVICE_ID = 'service_xxxxxx'` and `EMAILJS_TEMPLATE_ID = 'template_xxxxxx'` are literal placeholders.
- The code detects this and returns `{ success: true, simulated: true }` — silently lying that emails were sent.
- **Missing:** Real keys, actual email delivery, templates.

**3. Rent Reminders Cron — `api/cron-rent-reminders.js` — ~40% complete**
- Logic exists but:
  - All rent is hardcoded to be due on the 1st of the month regardless of actual lease start date.
  - SMS delivery is a `console.log` simulator, not a real SMS.
  - The security guard is **commented out** (lines 30–32): `// if (req.headers.authorization !== ...)`
  - Uses `import admin from 'firebase-admin'` (legacy namespace) instead of the modular SDK used everywhere else.

**4. Subscription Payment → Commission — `commissionService.js`**
- Commission recording runs client-side. Anyone with Firestore access can call `recordPaymentAndCommission` with arbitrary amounts.
- No server-side validation that a real payment occurred before writing to the `commissions` collection.
- **Missing:** Server-side trigger (Cloud Function or Vercel function) that only fires on verified payment.

### 2.3 Stub / Placeholder Code

| Location | Issue |
|---|---|
| `src/utils/emailService.js:8-10` | `'service_xxxxxx'`, `'template_xxxxxx'`, `'YOUR_PUBLIC_KEY'` — hard literal stubs |
| `src/utils/emailService.js:31-33` | Detects stubs, returns `{ success: true, simulated: true }` — silently fakes success |
| `api/cron-rent-reminders.js:29-32` | Auth check commented out — endpoint is publicly callable |
| `api/cron-rent-reminders.js:90` | `console.log('[SMS Simulator] Sent to ...')` — no real SMS delivery |
| `api/verify-kyc.js:33-34` | `await new Promise(resolve => setTimeout(resolve, 1500))` — mock delay |
| `api/verify-kyc.js:55` | Writes `provider: 'porichoy_mock'` — fake KYC record |
| `src/App.jsx:100-101` | Empty `useEffect` with only a comment: `// Legacy auto-migration removed.` |
| `src/pages/Signup.jsx:224` | ToS / Privacy links are `href="#"` — go nowhere |
| `api/cron-rent-reminders.js:80` | Link is `'/mock-checkout?paymentId=RENT_...'` — points to a non-existent page |

### 2.4 Missing Features (Inferred)

| Gap | Severity |
|---|---|
| Zero automated tests (unit, integration, e2e) | 🔴 Critical |
| No error monitoring (Sentry/Datadog — logger.js has a TODO) | 🔴 Critical |
| No CI/CD pipeline — deploys directly from git push | 🟡 High |
| No rate limiting on Firestore writes (spam viewing requests, messages) | 🟡 High |
| Missing `404 Not Found` route — unmatched URLs silently render blank | 🟡 High |
| No image optimization / lazy-loading hints on property cards | 🟡 Medium |
| No Content Security Policy (CSP) headers | 🟡 Medium |
| No pagination or infinite scroll on Search results | 🟡 Medium |
| `moveIns` collection queried in `PropertyDetails.jsx` but collection appears to be named `tenantMoveIns` in the cron — naming inconsistency | 🟡 Medium |
| `agentCommission` field collected in `AddProperty.jsx` form state but never used or validated | 🟠 Low |

---

## PHASE 3 — BUG & ISSUE DETECTION

### 3.1 Critical Logic Bugs

**BUG-01: `isOwner` Determination in `ConversationDetail.jsx` (Line 441) — WRONG LOGIC**
```javascript
// Current code — always makes participant[0] the owner:
const isOwner = conversation.participants?.[0] === currentUser?.uid;
```
The `participants` array is `[ownerId, tenantId]` by convention, but this is not guaranteed. Array ordering in Firestore is not stable. If for any reason the array is stored differently, a tenant will see Accept/Decline buttons and vice-versa. The correct check is:
```javascript
// Fix: compare against the request's actual ownerId
const isOwner = request ? currentUser?.uid === request.ownerId 
              : conversation.participants?.[0] === currentUser?.uid;
```

**BUG-02: Missing Email Verification Check at Login — Dead UI State (`Login.jsx:28, 52-62`)**
```javascript
const [unverified, setUnverified] = useState(false);
// ...
const userCredential = await login(email, password);
// userCredential.user.emailVerified is NEVER CHECKED here
// setUnverified(true) is NEVER called
navigate(getRedirect(data.role, data.onboardingStep), { replace: true });
```
The `unverified` state and its beautiful warning UI block (lines 185–199) are completely dead. Users with unverified emails bypass the check and log straight in. `setUnverified` is never called.

**Fix:** After `await login(...)`:
```javascript
if (!userCredential.user.emailVerified) {
    setUnverified(true);
    await signOut(auth); // prevent access
    setLoading(false);
    return;
}
```

**BUG-03: Google Signup Ignores Referral Code — Revenue/Trust Loss (`Signup.jsx:115-136`)**

`handleGoogleSignup` calls `signInWithGoogle()` which calls `createUserDoc()` in `AuthContext`. `createUserDoc` never receives `refCode` from the URL. The referrer is never credited. The `referredBy` field is never written.

The email/password flow (`handleSignup`) correctly handles referrals (lines 66-95) but Google signup silently skips it. Since Google accounts are common, this is a significant referral system failure.

**BUG-04: `createNotification` Call Signature Mismatch — Silent Notification Failures**

The function signature in `notificationService.js` (line 15):
```javascript
export const createNotification = async (userId, type, title, message, link, metadata = {})
```
But callers in `messageService.js` (line 225) call it as an **object**:
```javascript
await createNotification({
    userId: tenantId,
    type: 'request_accepted',
    title: 'Viewing Request Accepted!',
    ...
});
```
This means `userId` receives the entire object, `type` receives `undefined`, etc. The notification writes `userId: {userId: ..., type: ...}` — a corrupt object. The notification is created in Firestore but is completely malformed and won't render correctly. Some callers use the object form, some use positional arguments — the codebase is inconsistent.

**BUG-05: `handlePaymentSubmitted` in `AddProperty.jsx` calls `createNotification` correctly (positional), but `PropertyDetails.jsx` (line 280) also calls it correctly (positional) while `messageService.js` calls it as an object — the function has two incompatible call conventions in production.**

### 3.2 Runtime Risk Areas

**RISK-01: Cloudinary Unsigned Upload Fallback (`AddProperty.jsx:203-204`)**
```javascript
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmkbsddqk';
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'cn6piwep';
```
These hardcoded fallback values (`dmkbsddqk`, `cn6piwep`) are real production credentials baked into source code. They are visible to anyone who reads the bundle. A malicious user can extract them and flood your Cloudinary account with unlimited unsigned uploads, consuming your storage/bandwidth quota and incurring costs.

The `api/cloudinary-sign.js` endpoint exists and is correctly secured — **but `AddProperty.jsx` never calls it**. It still does direct unsigned uploads.

**RISK-02: `AuthContext.jsx:209-225` — Hardcoded Superadmin Email**
```javascript
} else if (user.email === 'safi.has.official@gmail.com') {
    const superadminData = { ..., role: 'admin', isAdmin: true, ... };
    await setDoc(userRef, superadminData);
```
This creates an admin Firestore doc for anyone who logs in with that specific email — **even if they're not actually you**. If your Google account is ever compromised, or if someone creates an email account matching this address with a different provider, they get instant admin access. Admin status should only be granted via `set-admin-claim.js` (custom JWT claims), not email matching.

The same pattern is repeated in `AdminRoute.jsx:32`:
```javascript
if (currentUser.email !== 'safi.has.official@gmail.com' && (!userProfile || userProfile.role !== 'admin'))
```
This bypasses role checks entirely for that email — even if the Firestore role is not 'admin'.

**RISK-03: `cron-rent-reminders.js` — Unauthenticated Public Endpoint**
The authorization check is commented out. Anyone on the internet can POST to `/api/cron-rent-reminders` and trigger mass Firestore reads + notification writes. This is a DoS vector.

**RISK-04: `firebase.js:30` — Silent Persistence Failure**
```javascript
setPersistence(auth, browserLocalPersistence).catch(() => {});
```
If this fails (e.g., Safari ITP, private browsing), users silently lose their session on every page reload. No fallback, no user notice.

**RISK-05: Unsafe Number Coercion (`AddProperty.jsx:270-276`)**
```javascript
rent: Number(formData.rent),
area: formData.area ? Number(formData.area) : null,
beds: Number(formData.beds),
```
`Number('')` returns `0`. `Number('abc')` returns `NaN`. Both will be saved to Firestore without error. A listing with `rent: NaN` will be invisible in search results filtered by price, and crash any UI component doing arithmetic.

**RISK-06: Race Condition in Duplicate Request Check (`PropertyDetails.jsx:202-231`)**
The duplicate-check queries `viewing_requests` then writes a new request. Between the read and the write, another tab/device could submit a second request. Without a Firestore transaction wrapping both operations, duplicate requests can slip through.

**RISK-07: Memory Leak Potential — `ConversationDetail.jsx:339`**
```javascript
markConversationRead(conversationId, currentUser.uid).catch(() => {});
```
This is called inside a `useEffect` that subscribes to messages. If the component unmounts before the async call resolves, the state update inside the `.catch` chain (if any is later added) will trigger on an unmounted component. The empty `.catch(() => {})` masks this. Minor but worth noting.

### 3.3 Logic Bugs

**LOGIC-01: `getRedirect` in `Login.jsx:40-43` — Onboarding Param Ignored**
```javascript
function getRedirect(role, onboardingStep) {
    if (role === 'admin') return '/admin';
    return nextRoute; // onboardingStep parameter is declared but never used!
}
```
The function accepts `onboardingStep` but always returns `nextRoute` for non-admins. If a user hasn't completed onboarding, they bypass the `/onboarding` redirect entirely. The `OnboardingGuard` component only protects the `setup-owner-profile` route, not the general post-login flow.

**LOGIC-02: `vercel.json` Missing — API Routes May 404**
The `vercel.json` at the root only has:
```json
{"rewrites": [{"source": "/(.*)", "destination": "/"}]}
```
This catch-all rewrite will intercept `/api/*` requests before they reach the serverless functions on local Vite dev server. In production on Vercel this works differently, but local testing of the API functions is broken.

**LOGIC-03: Duplicate `image_url` and `imageUrl` Fields**
`AddProperty.jsx` maintains both `formData.imageUrl` and `formData.image_url` as aliases (lines 86-87, 237-238). Both are written to Firestore. `PropertyDetails.jsx` and `PropertyCard` read `property.images[0]`. This creates schema confusion — three different fields for the primary image.

**LOGIC-04: `handleDragEnd` Swipe Direction Inversion (`ConversationDetail.jsx:201-207`)**
```javascript
const handleDragEnd = (event, info) => {
    if (info.offset.x > 80) {
        onDelete(msg.id);     // swipe RIGHT = delete
    } else if (info.offset.x < -80) {
        onReply(msg);         // swipe LEFT = reply
    }
};
```
Typically swipe-right = reply, swipe-left = delete (WhatsApp/Telegram convention). This is inverted. The opacity animation labels also confirm the inversion (left shows delete icon, right shows reply). This will confuse users.

**LOGIC-05: `notificationService.js` — `kyc_verifications` Collection Not Covered by Firestore Rules**
The `verify-kyc.js` API writes to `db.collection('kyc_verifications')`. This collection has no rule in `firestore.rules`. It falls through to the final catch-all `allow read, write: if false` — but that's only enforced client-side. Admin SDK bypasses rules entirely. However, the client can never read their own KYC record. The KYC data written to the user document (`isVerified`, `nidNumber`) is what the client actually reads.

### 3.4 API & Integration Issues

**API-01: `cloudinary-sign.js` Endpoint Is Unused**
The secure signed-upload endpoint was correctly built and deployed, but `AddProperty.jsx` never calls `/api/cloudinary-sign`. It skips authentication and uploads directly using the hardcoded unsigned preset. **The security work is done — it just needs to be wired up in the client.**

**API-02: `verify-kyc.js` Stores Raw NID Number in Plain Text**
```javascript
await verificationRef.set({ nidNumber: cleanNid, ... });
await userRef.update({ nidNumber: cleanNid, ... });
```
NID numbers are PII / sensitive government ID data. Storing them in plain text in Firestore violates best practices. They should be hashed (irreversibly, e.g., SHA-256 + salt) or encrypted before storage.

**API-03: No Timeout on Cloudinary Uploads**
```javascript
const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: data
});
```
No `AbortController` timeout. On a slow 3G connection (Bangladesh market!), this can hang indefinitely, blocking the user on the property creation form with a spinner that never resolves.

**API-04: `process-payment-webhook.js` — ±2 BDT Tolerance Is Too Wide**
```javascript
const tolerance = 2;
if (Math.abs(storedAmount - parsedAmount) > tolerance) { ... }
```
A ±2 BDT tolerance on a ৳45,000 security deposit seems reasonable. But for a ৳49 listing fee, a ৳47 payment gets auto-approved (96% of value). Consider making the tolerance percentage-based or amount-scaled.

**API-05: `cron-rent-reminders.js` Rent Link Points to Non-Existent Page**
```javascript
link: `/mock-checkout?paymentId=RENT_${doc.id}&amount=${data.rentAmount || 15000}&method=bkash`
```
The path `/mock-checkout` does not exist in `App.jsx`'s route definitions. Clicking the rent reminder notification will result in a blank/404 page.

---

## PHASE 4 — SECURITY SUMMARY

| Severity | Issue | File |
|---|---|---|
| 🔴 CRITICAL | Hardcoded admin email bypass — anyone with this email gets admin | `AuthContext.jsx:209`, `AdminRoute.jsx:32` |
| 🔴 CRITICAL | Cloudinary unsigned preset hardcoded in bundle — abuse vector | `AddProperty.jsx:203-204` |
| 🔴 CRITICAL | Cron endpoint has no auth — publicly triggerable DoS | `cron-rent-reminders.js:29-32` |
| 🔴 CRITICAL | KYC is entirely simulated — users get "Verified" badge for nothing | `verify-kyc.js` |
| 🔴 CRITICAL | NID numbers stored in plain text | `verify-kyc.js:50-64` |
| 🟡 HIGH | Commission credited client-side — no server validation of payment | `commissionService.js` |
| 🟡 HIGH | No rate limiting on viewing request creation | `PropertyDetails.jsx` |
| 🟡 HIGH | No CSP headers configured | `vercel.json` |
| 🟠 MEDIUM | `reviews` collection: `allow create: if isSignedIn()` — anyone can post reviews for any property with any score | `firestore.rules:105` |
| 🟠 MEDIUM | `notifications` collection: `allow create: if isSignedIn()` — any user can send arbitrary notifications to any user ID | `firestore.rules:99` |

---

## PHASE 5 — ACTIONABLE FIX ROADMAP

### Priority 1 — Fix Immediately (Before Any Public Launch)

1. **Wire up the signed Cloudinary upload.** In `AddProperty.jsx`, replace the direct unsigned fetch with a call to `/api/cloudinary-sign` to get a signature, then upload with the signature. The endpoint is already built correctly.

2. **Remove the hardcoded admin email bypass** from `AuthContext.jsx` and `AdminRoute.jsx`. Use Firebase custom claims exclusively. Run `set-admin-claim.js` once to bootstrap your first admin.

3. **Fix the `createNotification` call signature.** Standardize all callers to use positional arguments OR rewrite the function to accept an object. Pick one and apply it everywhere.

4. **Fix the `isOwner` check** in `ConversationDetail.jsx` to use `request.ownerId` rather than array position.

5. **Authenticate the cron endpoint.** Uncomment the authorization check in `cron-rent-reminders.js` and set `CRON_SECRET` in Vercel environment variables.

6. **Fix the Login email verification check** — after `await login(...)`, check `userCredential.user.emailVerified` and call `setUnverified(true)` if false.

### Priority 2 — Before Scaling

7. **Fix referral code for Google signups.** Read `searchParams.get('ref')` in `handleGoogleSignup` and pass it to `signInWithGoogle`, then handle referral attribution in `AuthContext.createUserDoc`.

8. **Add `AbortController` timeout** to Cloudinary uploads (10-30 seconds) in `AddProperty.jsx`.

9. **Add `Number.isNaN()` guards** before saving numeric fields:
   ```javascript
   const rent = Number(formData.rent);
   if (Number.isNaN(rent) || rent <= 0) throw new Error('Invalid rent amount');
   ```

10. **Add a 404 catch-all route** in `App.jsx` routes.

11. **Hash or encrypt NID numbers** before writing to Firestore in `verify-kyc.js`.

12. **Restrict Firestore rules** for `reviews` and `notifications`:
    - Reviews: validate `reviewerId === request.auth.uid`
    - Notifications: restrict create to only known system contexts (use a backend function instead of client-side writes).

### Priority 3 — Technical Debt

13. **Add Vitest + React Testing Library** for at least auth flows and payment flows.
14. **Wire up Sentry** (logger.js has the TODO on line 1).
15. **Real KYC API** — integrate Porichoy API properly; never write `isKycApproved: true` from a simulated check.
16. **Fix the `/mock-checkout` link** in rent reminders — route doesn't exist.
17. **Consolidate `imageUrl`/`image_url`/`images[0]`** — pick one canonical field name.
18. **Normalize `moveIns` vs `tenantMoveIns`** collection name inconsistency.
19. **Set up CI/CD** — at minimum a GitHub Actions workflow that runs lint + type check on every PR.
20. **Move commission recording server-side** — triggered by webhook after payment verification, not by client code.

---

*Report generated from direct source file analysis of 40+ files across the AnyLet Web repository.*
