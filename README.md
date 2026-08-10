# AnyLet

Rental marketplace for Bangladesh — listings, viewing requests, in-app messaging, escrowed
security deposits, and mobile-money payments (bKash / Nagad / Rocket) reconciled over SMS.

React 19 + Vite 7 SPA · Vercel serverless API · Firebase Auth + Firestore · Cloudinary ·
Capacitor 8 for iOS/Android.

| | |
|---|---|
| **How it fits together** | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Security model & open findings** | [SECURITY.md](SECURITY.md) |
| **Design decisions** | [`_Anylet_Docs/Decisions/`](_Anylet_Docs/Decisions/) |

> **Before deploying:** [SECURITY.md](SECURITY.md) lists one critical and six high-severity
> open findings, including two core flows (listing creation, KYC submission) that do not
> currently work against the rules in this repo. Read it first.

---

## Quick start

```bash
npm install
```

Create `.env.local` in the project root (see [Environment](#environment) below), then:

```bash
npm run dev
```

Vite serves the app on `http://localhost:5174` and proxies `/api/*` to the local API
server on `:3001`.

> **Local API caveat:** `dev-api-server.mjs` currently registers only
> `/api/cloudinary-sign`. Every other endpoint 404s in local dev — payment verification,
> escrow, and the admin actions must be exercised against a Vercel preview deployment.
> Adding a route is one line in `dev-api-server.mjs`.

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite (`:5174`) + local API server (`:3001`), concurrently |
| `npm run dev:api` | API server alone |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the built output |
| `npm run lint` | ESLint over the repo (**currently 233 errors** — see [SECURITY.md L-3](SECURITY.md#l-3-no-ci-no-enforced-lint-233-eslint-errors)) |
| `npm run test:rules` | Firestore rules tests — needs the emulator running first |
| `npm run cap:sync` | Build + sync both native shells |
| `npm run cap:android` / `cap:ios` | Build, sync, and open the native project |

Rules tests need the emulator in a second terminal:

```bash
firebase emulators:start --only firestore
```

Firestore listens on `:9090`, the emulator UI on `:4001` (`firebase.json`).

---

## Environment

`.env.local` for local dev; the same keys go in Vercel project settings for deploys.

### Client (`VITE_*` — bundled into the client, public by design)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_API_BASE_URL=            # optional; Capacitor builds only. Defaults to https://anylet.com
```

The Firebase web config is not a secret — it identifies the project, it does not
authorize anything. `firestore.rules` is the access control.

### Server (never exposed to the client)

```
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=      # or FIREBASE_SERVICE_ACCOUNT_JSON (base64) instead of these three
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMS_WEBHOOK_SECRET=              # min 16 chars — api/sms-webhook.js refuses to load otherwise
CRON_SECRET=
UPSTASH_REDIS_REST_URL=          # optional; without it, rate limiting falls back to in-process
UPSTASH_REDIS_REST_TOKEN=        # memory and does not survive serverless cold starts
```

`.env` and `.env.local` are gitignored, along with `*firebase-adminsdk*.json` and
`*serviceAccount*.json`. Verified: no secret file is tracked in this repo. Both env files
hold a live admin private key on disk — treat your workstation accordingly.

---

## First-run setup

1. **Seed the fee configuration.** Nothing prices correctly without
   `platformConfig/fees`:
   ```bash
   node --env-file=.env.local seed_fees.js
   ```
   ⚠️ `seed_fees.js` writes `commissionRate: 0.50`, which `api/verify-payment.js`
   interprets as **50% of every payment** paid out as referral commission. Correct it to
   `0.02` before seeding — see [SECURITY.md H-6](SECURITY.md#h-6-seeded-referral-commission-is-50-not-05).

2. **Deploy the rules.**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Bootstrap the first admin.** Admin privilege is a Firebase custom claim, and
   `/api/admin?action=set-claim` requires an existing admin — so the first one has to be
   set out of band, with a one-off script using the Admin SDK
   (`auth.setCustomUserClaims(uid, { admin: true, role: 'admin' })`). Every subsequent
   grant goes through the admin panel.

---

## Project layout

```
src/
  App.jsx           Route table — ~50 routes, all lazy-loaded
  main.jsx          Mount + provider stack + service worker
  firebase.js       Client SDK init (Auth, Firestore, App Check)
  pages/            46 page components  ·  pages/admin/  new admin surface
  components/       ~55 components  ·  map/ holds the Leaflet layer
  contexts/         Auth, Theme, Language, Toast
  hooks/  utils/  config/  data/
api/
  _lib/             Admin SDK init, withMiddleware, feeCalculator
  *.js              11 Vercel serverless functions
firestore.rules     Client authorization policy — the primary access control
tests/              Firestore rules tests (4 assertions)
android/  ios/      Capacitor native shells
```

`mobile/` and `zip/` are abandoned prototypes. The root also holds ~20 loose scratch and
report files that are not part of the build.

---

## How payments work

There is no card processor. Payment is reconciled out of band:

1. The user pays the merchant number from their own bKash / Nagad / Rocket app.
2. The merchant phone receives a confirmation SMS; a watcher app forwards it to
   `POST /api/sms-webhook` with a shared bearer secret.
3. The webhook records `unclaimed_transactions/{TXNID}` — the TxnID **is** the document
   ID, which makes double-recording and replay structurally impossible.
4. The user enters their TxnID in the app. `POST /api/verify-payment` recomputes the
   expected amount server-side, matches the provider, and atomically claims the
   transaction inside a Firestore transaction — then applies the booking, subscription,
   listing, or escrow effect.

The client never sends an amount, and any request containing one is rejected outright.
Full flow, including the escrow lifecycle and the three-tier amount tolerance, is in
[ARCHITECTURE.md §5](ARCHITECTURE.md#5-payment-architecture).

---

## Beta mode

`src/config/featureFlags.js` exports `IS_BETA = true`. While set, listings are free and
bypass `PaymentModal` entirely; `BetaLock` blurs unfinished surfaces. The paid path is
preserved intact and reactivates when the flag flips to `false`.

The beta write currently violates the `properties` create rule —
see [SECURITY.md H-1](SECURITY.md#h-1-the-active-beta-listing-flow-is-rejected-by-the-properties-create-rule).

---

## Deployment

Vercel, on push to `main`. `vercel.json` holds only two rewrites — no headers block, no
cron block. There is **no CI**: no lint gate, no test gate, no audit gate before a deploy
goes out.

Eleven serverless functions against the Hobby plan's limit of twelve. That ceiling is why
`api/admin.js` and `api/escrow.js` are `?action=`-dispatched routers rather than separate
files — adding a new endpoint means either consuming the last slot or folding the handler
into an existing router.

Native builds wrap the same `dist/` output via Capacitor.

---

## Contributing

- Run `npm run lint` and `npm run test:rules` before pushing. Neither is enforced by CI
  yet, so it is on you.
- Any change touching money, custom claims, or `firestore.rules` should come with a rules
  test in `tests/firestore.rules.test.mjs`.
- Fee values belong in `platformConfig/fees` and are read through
  `api/_lib/feeCalculator.js`. Do not add fee constants to handlers.
- Frontend fee displays are **display-only**. The server never trusts a client-supplied
  amount.

Security issues: do not open a public issue — see
[SECURITY.md §8](SECURITY.md#8-reporting-a-vulnerability).
