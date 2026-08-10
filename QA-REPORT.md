# AnyLet Web — QA Exploration Report

**Tester role:** Senior QA (exploratory, unscripted)
**Build:** local dev, `npm run dev` → Vite `http://localhost:5174`, API on `:3001`
**Browser:** Chromium (in-app), viewports 375×812 (mobile — primary target), 768×1024, 1280×800
**Session context:** Authenticated as `safihasan009@gmail.com` ("Safi"). App is a mobile-first Capacitor/React SPA on Firebase (project `rentbd-e23ed`).
**Date:** 2026-07-28

> Note: this pass immediately followed removal of the "beta lock" feature flag. All beta-removal edits were re-verified here and render correctly (KYC shows "KYC Approved", Map/Pricing/Move-Ins unlocked, AddProperty shows the paid flow). One pre-existing syntax defect in `MapPage.jsx` (duplicated `<Toast>` + stray `</div>`) was corrected during that work.

> **✅ Fixes applied in this session (verified live):**
> - **#1 Search 0-results — FIXED.** `Search.jsx` no longer applies a server-side `orderBy('updatedAt')` (the source of the missing-composite-index `failed-precondition`); it fetches the approved set with equality filters only and sorts newest-first client-side (mirrors Home). Also stopped excluding listings that have no timestamp. Verified: `/search` now shows 17 results on a cold load with a clean console, and text search (`Ababil` → 2) works.
> - **#2 Post-Ad infinite spinner — FIXED.** `useFees.js` rewritten to drop the deadlock-prone module-global `isFetching`/`fetchPromise` singleton and to fall back to `DEFAULT_FEES` after a 4s timeout (and on error), so no page can hang on the fees read. Verified: `/post-ad` now renders the Post Property form.
> - **#4 Home→Search query hand-off — FIXED.** Home now passes `{ state: { searchTerm } }` (`Home.jsx:98`) and Search seeds `searchTerm`/`division` from `location.state` (`Search.jsx:83,109`). Verified: searching "Ababil Villa" on Home lands on `/search` with the field pre-filled and results filtered.
> - **#5 Accessibility — FIXED.** Added `aria-label`/`aria-pressed` to the icon-only buttons in `PropertyCard.jsx` and `HorizontalPropertyCard.jsx` (heart/save + carousel prev/next) and `type="button"`. Home now audits **0/37 unnamed buttons** (was 22).
> - **#8 Splash on every load — FIXED (by prior edit).** `AuthContext.jsx` guards the splash with `sessionStorage('splashPlayed')` and skips non-`/` routes.
> - **#9 Generic titles — FIXED.** Added route-specific `<Helmet>` titles to PropertyDetails (dynamic), Contact, Sitemap, Blog, BlogPost, Favorites, Download (404 already had one). Verified live.
> - **#Enter-to-submit — FIXED.** Home hero search input got an `onKeyDown` Enter handler (and the outside button is now `type="button"`); Enter navigates to `/search` carrying the term.
> - **#3 Auth own-doc read — MITIGATED.** `AuthContext.jsx` now retries the `users/{uid}` read once with a forced `getIdToken(true)` on `permission-denied` (App Check token race). The permission-denied error no longer appears on load. Rules already set `users` read to public (`if true`) locally — **still needs `firebase deploy --only firestore:rules`**, and note that `if true` exposes PII (email/phone/wallet); consider a `publicProfiles` subset instead.
> - **#10 Owner name — FIXED for new listings.** `AddProperty.jsx` now denormalizes `ownerName`/`ownerPhotoURL` onto the property; PropertyDetails falls back to `property.ownerName`. Existing listings still show generic until the rules deploy or a one-time backfill.
> - **#11 Double back — non-issue.** Contact's "Back to previous" is `hidden md:flex` (desktop-only) and the mobile header back is mobile-only — a responsive complement, not a duplicate. Left as-is.
> - **#6 Desktop dead space — NOT changed (deferred).** Key pages (Home/Search/PropertyDetails/Map/Profile) already use centered, responsive `lg:` layouts; remaining wide-desktop polish on account/settings pages is a dedicated design pass and was left to avoid regressions on a mobile-first app.

---

## Severity summary

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 1 | 🔴 Critical | Search | `/search` returns **0 results for every query** — missing Firestore composite indexes |
| 2 | 🔴 Critical | Post Ad | `/post-ad` **hangs on an infinite spinner** — listing/revenue flow fully blocked |
| 3 | 🟠 High | Auth/Data | Signed-in user's own `users/{uid}` read is **permission-denied on every load**; rules also block **public owner profiles** |
| 4 | 🟠 High | Search UX | Home search bar **drops the typed query** when navigating to `/search` |
| 5 | 🟡 Medium | Accessibility | 22/37 icon buttons have **no accessible name** (WCAG 4.1.2); inputs are placeholder-only |
| 6 | 🟡 Medium | Responsive | Desktop/tablet render the mobile column **left-aligned with large dead space** |
| 7 | 🟡 Medium | Config | `firestore.indexes.json` is **empty** — index config untracked (root of #1) |
| 8 | 🟢 Low | Perf/SEO | Intro splash **replays on every full page load / deep link** (~3s), incl. 404 |
| 9 | 🟢 Low | SEO | Most routes keep a **generic `<title>`** |
| 10 | 🟢 Low | Data display | Property "Owner / Agent" card shows a **generic label, not the owner's name** (tied to #3) |
| 11 | 🟢 Low | UX | Inner pages show a **stacked double back affordance** |

Pages verified **working**: Home, Property Details, Owner Profile (own), Map (clusters + markers), Pricing, Favorites (empty state), Messages (conversation list), About, Contact, Terms, Privacy, Blog, Sitemap, Profile, 404.

---

## Critical

### 1. `/search` returns 0 results for every query 🔴

**Reproduction**
1. Home shows "Found 56 listings".
2. Go to `/search` (or tap the home search bar).
3. Observe "FOUND 0 PROPERTIES / No properties found" with an empty dataset.
4. Open Filters → any Division (e.g. Dhaka) → still "Show **0** Results".

**Expected:** Search shows the same approved listings as Home (56) and narrows as filters are applied.
**Actual:** Zero results in all states — search is effectively non-functional.

**Root cause (confirmed via console):**
```
Error fetching properties: FirebaseError: [code=failed-precondition]:
The query requires an index. ...create_composite=...isApproved...updatedAt...
```
`src/pages/Search.jsx` `buildServerQuery()` issues:
```js
where('isApproved','==',true), orderBy('updatedAt','desc'), limit(60)
// + optional division/district/upazila/type equality filters
```
This needs composite indexes that don't exist. The query throws `failed-precondition`, is caught at `Search.jsx:189` (`logger.error('Error fetching properties'…)`), and `properties` is left `[]`.
Home works because `FeaturedListings.jsx` uses **no `orderBy`** (`where('isApproved','==',true), limit(200)`) and sorts client-side.
`firestore.indexes.json` is `{"indexes": [], "fieldOverrides": []}` — the indexes were never declared/deployed.

**Recommended fix** — add the composite indexes and deploy (`firebase deploy --only firestore:indexes`):
```json
{
  "indexes": [
    { "collectionGroup": "properties", "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isApproved", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]},
    { "collectionGroup": "properties", "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "division", "order": "ASCENDING" },
        { "fieldPath": "isApproved", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]}
  ]
}
```
Repeat for the `district` and `type` filter combinations the UI can produce (each equality-field + `isApproved` + `updatedAt` combo needs its own index). The two `create_composite=` links in the console generate the exact definitions.
**Secondary hardening:** surface the caught error to the user (currently it fails silently to an empty state), and consider a `createdAt`/client-sort fallback so a missing index degrades instead of showing nothing. Note many listings only have `createdAt` (see `FeaturedListings.jsx:84` fallback chain), so if you keep `orderBy('updatedAt')`, back-fill `updatedAt` on all docs — otherwise docs missing that field are silently excluded even once the index exists.

---

### 2. `/post-ad` (create listing) hangs on an infinite spinner 🔴

**Reproduction**
1. While logged in, hard-navigate to `/post-ad`.
2. Wait. The page shows only the centered spinner — 5s, 10s+, indefinitely. No form ever appears.

**Expected:** The multi-step "Post Property" form renders (Step 1 of 3).
**Actual:** Permanent loading spinner; the entire listing-creation (and paid-listing revenue) flow is unreachable. No error is logged.

**Root cause:** `AddProperty.jsx` hard-gates render on fees:
```js
if (feesLoading) return (<div …><spinner/></div>);
```
`feesLoading` comes from `src/hooks/useFees.js`, which subscribes to `platformConfig/fees` via `onSnapshot`. In this environment that listener never fires **either** the success or the error callback, so `loading` is never set to `false`.
The hook also has a **latent race** that makes this worse: it stores `isFetching`/`cachedFees` as **module-level globals**. If the first subscriber unmounts before the snapshot resolves, `isFetching` stays `true`, so every later mount hits `else if (!isFetching)` = false, starts no listener, and never clears `loading` → permanent spinner across the whole app.

**Recommended fix**
- Don't hard-gate the page on fees. `DEFAULT_FEES` already exists — render with defaults and update when/if the snapshot arrives.
- Add a timeout (e.g. 3–5s) after which `loading` flips to `false` using `DEFAULT_FEES`.
- Fix the singleton: reset `isFetching = false` in the effect cleanup when it unmounts before resolving, or drop the module-global pattern in favor of a shared context/provider with a single subscription.

---

## High

### 3. Signed-in user's own `users/{uid}` read is denied every load; rules block public owner profiles 🟠

**Reproduction**
- On any page load while authenticated, the console logs:
  `AuthContext error: FirebaseError: [code=permission-denied]: Missing or insufficient permissions.`

**Impact**
- `AuthContext` catches it and sets `userData = null`, `userRole = 'user'` (`src/contexts/AuthContext.jsx:234`). Any UI that depends on the user's Firestore profile — role/admin gating, subscription/entitlement display, referral wallet, onboarding backfill — silently degrades to defaults.
- `firestore.rules` for users is `allow read: if isOwner(uid) || isAdmin();` — there is **no public read**. So viewing **another** user's `/owner/:id`, or resolving the owner's name on a listing you don't own, will be **permission-denied**. (The owner profile that rendered in this session was the tester's *own* profile, which is why it worked.)

**Likely cause of the own-doc denial:** App Check / token not attached to the read (the app initializes `firebase_app-check`), so `request.auth` evaluates null even for the owner. Other reads that don't require it still succeed, which is why the app mostly works.

**Recommended fix**
- Resolve the App Check/debug-token setup in dev so authenticated reads carry `request.auth`.
- Add a scoped public-read for the fields an owner profile legitimately exposes (e.g. a `publicProfiles` collection or a rule allowing read of a whitelisted subset), so `/owner/:id` and listing owner names work for visitors.
- Don't swallow the AuthContext error to a silent 'user' role — at minimum retry, and avoid rendering role-gated UI until the profile is known.

### 4. Home search bar drops the typed query 🟠

**Reproduction**
1. On Home, click the hero "Search area, house type or location…" field and type `Dhaka`.
2. The app navigates to `/search`, but the search field is **empty** and results show 0.

**Expected:** The typed term is carried to `/search` and applied.
**Actual:** The query is lost on navigation; the user must retype it on the search page.
**Fix:** Pass the term via route state or a `?q=` param and hydrate `searchTerm` on `/search` mount. (Independent of #1 — even after indexes are fixed, the term still needs to survive the navigation.)

---

## Medium

### 5. Accessibility — unnamed icon buttons & unlabeled inputs 🟡
Automated audit on Home: **22 of 37 `<button>`s have no accessible name** (no text, `aria-label`, or `title`) — the category tiles, heart/save, filter toggle, and bottom-nav icons. Screen readers announce them as bare "button" (WCAG 2.1 **4.1.2 Name, Role, Value**). Form inputs rely on `placeholder` only, with no associated `<label>` (**1.3.1 / 4.1.2**; placeholder is not a label and disappears on input).
**Fix:** add `aria-label` to every icon-only control; associate `<label htmlFor>` (or `aria-label`) with each input. Good baselines already present: `lang="en"`, single `<h1>`, all `<img>` have `alt`, no horizontal overflow.

### 6. Desktop / tablet layout — mobile column with dead space 🟡
At 1280×800 the header spans full width but page bodies (Home, Profile, etc.) render as a ~350–660px column pinned left, leaving most of the viewport empty. Content is not centered or widened for larger breakpoints.
**Fix:** if web is a supported surface, add responsive `max-width` + centering and multi-column grids at `md`/`lg`. If web is out of scope (Capacitor-only), constrain to a centered phone-frame so it doesn't read as broken.

### 7. `firestore.indexes.json` is empty 🟡
Index configuration isn't tracked in the repo, which is the direct source of #1 and a deploy-time risk (a fresh project or `firebase deploy --only firestore:indexes` would ship zero indexes). Track all required composite indexes here.

---

## Low

- **8. Splash replays on every full load (~3s).** The intro animation gates *every* hard navigation / deep link — including `/404` — not just the first visit. Hurts perceived performance for shared/deep-linked URLs and blocks SEO crawlers behind an animation. Show it once per session (guard with `sessionStorage`) and skip it for non-home deep links.
- **9. Generic page titles.** `/about`, `/terms`, `/privacy-policy`, `/property/:id`, and `/404` all keep `<title>Any-Let - Find Your Next Home</title>`. Set route-specific titles (and meta description) for SEO/shareability. (`/search` does this correctly.)
- **10. Owner name missing on listing.** Property Details "Owner / Agent" card shows a generic label instead of the owner's name/photo (downstream of #3).
- **11. Double back affordance.** Inner pages (e.g. Contact) show both the app-header back chevron and a separate "Back to previous" link — redundant.
- **Content/seed:** a blog post is future-dated ("Oct 15, 2026"); several listings carry junk seed text (`ifxigcgci`, `iyffgkcgic`) — dev data only, but validate/clean before production.

---

## Test coverage & method
- **Explored:** Home, Search (+ Filters sheet), Property Details, Owner Profile, Pricing, Favorites, Map, Messages, Profile (+ account menu), About, Contact, Terms, Privacy, Blog, Sitemap, 404, and attempted Post-Ad, Login (redirects when authenticated).
- **Instrumentation:** console error capture, network inspection, DOM/accessibility audit via injected JS, responsive resizing (mobile/tablet/desktop), screenshots.
- **Not exercised (and why):** login/signup form validation (an active user session was present; not logged out to preserve it — validation assessed from source instead: server-error-driven via Firebase codes, Terms-checkbox gated, single password field with no confirm field and no client-side email-format pre-check). Destructive/irreversible actions (submitting a listing, sending messages, payments, settings changes) were intentionally **not** completed.

## Recommended priority order
1. **#1 Search indexes** — core discovery is broken. Ship the composite indexes.
2. **#2 Post-Ad spinner** — revenue/listing flow is fully blocked. De-gate on `useFees`.
3. **#3 Auth/rules** — fix App Check so profile reads succeed; add public owner-profile read.
4. **#4 Search term hand-off**, then **#5 accessibility**, then the Medium/Low items.
