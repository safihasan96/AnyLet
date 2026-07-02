---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Login-Page, VerifyEmail-Page, Onboarding-Page]
---

# Page: Signup

## Purpose
The registration page where new users can create an AnyLet account using either an Email/Password combination or Google Single Sign-On (SSO). It handles referral code validation (both from URL parameters and manual input) and initializes the user's Firestore document.

## Route
`/signup` — Publicly accessible

## What the User Can Do Here
1. Sign up using a Google account (`signInWithGoogle`).
2. Sign up using Email and Password (`signup`).
3. View a custom welcome banner if they arrived via a referral link (e.g., `?ref=code`).
4. Manually enter a referral code via an expandable accordion menu.
5. See real-time validation feedback (Valid/Invalid/Checking) as they type a manual referral code.
6. Accept the Terms of Service (mandatory for Email signup).
7. Navigate back to the homepage or to the Login page.

## Features & Functionality

### Referral System Integration
- **URL Parameter (`?ref=...`):** Automatically checked on mount. If valid, fetches the referrer's name to display a personalised welcome banner ("John invited you!").
- **Manual Entry:** Uses a debounced effect (700ms) to query the `users` collection for the typed `referralCode`. Displays a success state with the referrer's name if matched.
- **Priority:** If a URL `ref` parameter exists, it overrides any manual input.
- **On Success:** Adds the new user's UID to the referrer's `refereeIds` array and stores the referrer's UID in the new user's `referredBy` field.

### Document Initialisation
Upon successful signup (Email/Password), it creates the foundational `users/{uid}` document with:
- Default roles (`userRole: 'tenant'`).
- Referral wallet structure (`referralWallet: { available: 0, withdrawn: 0 }`).
- A newly generated referral code for the user (`generateReferralCode(email)`).
- Onboarding status (`onboardingStatus: 'IN_PROGRESS'`).

### Animations
Highly animated using Framer Motion:
- Staggered entrance for form elements (`pageVariants`, `itemVariants`).
- Expandable accordion for the manual referral code section (`expandVariants`).
- Dynamic status icons inside the input field that pop in/out based on the validation state (`statusVariants`).
- Honours the user's OS preference via `useReducedMotion`.

## UI Elements
- `GoogleLogo` — Custom SVG component.
- `InputField` — Reusable component handling the floating label and icon styling.
- `AnimatePresence` wrappers for conditional elements (Error banners, Referral banners, Status icons).

## Data & State
### Firestore Collections Used
- `users` — Read (referral code validation) / Write (create new user doc, update referrer's array).

### Local State
- `email`, `password`, `agreeTerms` — Form inputs.
- `error`, `loading`, `googleLoading` — Status indicators.
- `referrerBannerName` — Hydrated from URL ref check.
- `referralOpen`, `manualRefCode`, `refStatus`, `refName` — Manual referral flow state.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `signup` and `signInWithGoogle`.

## Navigation
### Enters From
- Navigation bar "Register" button.
- Login page "Create Account" link.
- Referral URLs (e.g., `https://anylet.com/signup?ref=john-doe-a3f9`).

### Exits To
- `/verify-email` — Upon successful Email/Password signup.
- `/onboarding` — Upon successful Google SSO signup (Google handles email verification automatically).
- `/login` — Via the bottom link.
- `/` — Via the top-left back button.

## Permissions & Auth
- Handled via Firebase Auth `createUserWithEmailAndPassword`.

## Known Issues & What to Fix
- [ ] Currently, Google Signup handles the referral link via a parameter in `signInWithGoogle(codeToUse)`, but the document creation logic (which updates the referrer's `refereeIds` array) happens inside the Google Cloud Function or context, which is disjointed from the detailed Email/Password setup block here.
