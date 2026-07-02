---
title: Arch — Auth and Security
type: architecture
tags: [architecture, security, auth, firebase]
status: stable
last-scanned: 2026-06-28
related: [Feature-Auth, Service-Firebase]
---

# Auth and Security Architecture

## Authentication Providers
- **Email/Password**: Standard sign-in and registration (`createUserWithEmailAndPassword`).
- **Google OAuth**: One-tap sign-in (`signInWithPopup`). Features auto account-linking (if a user signs in with Google but already has an email/password account, they are prompted to link).

## Context & State Management
- **`AuthContext.jsx`**: Centralized authentication state.
- **Onboarding Flow**: Newly created users (via Email or Google) are assigned default onboarding fields and pushed through the setup wizard before they are allowed into protected routes.
- **Roles**: Users default to `user` role (with a `userRole: 'tenant'` UI preference).

## Route Guards
- `ProtectedRoute`: Checks `currentUser` existence.
- `OnboardingGuard`: Checks `onboardingStatus === 'completed'`.
- `AdminRoute`: Checks the Firebase custom claim `role === 'admin'`.

## Backend Security (Custom Claims & APIs)
- Admin privileges are not purely client-side. The `/api/set-admin-claim.js` script provisions Firebase Custom Auth Claims for backend verification.
- Sensitive endpoints like `/api/admin-review-kyc.js` utilize the `withMiddleware.js` wrapper to enforce the admin claim on the incoming JWT bearer token.

## Security Rules (Firestore)
- Evaluated via `tests/firestore.rules.test.mjs`. Assumed tightly locked down, using custom claims and `request.auth.uid` comparisons to ensure users can only modify their own profiles and listings.
