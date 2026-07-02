---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Signup-Page, ForgotPassword-Page, ChangePassword-Page, Onboarding-Page, Home-Page]
---

# Page: Login

## Purpose
The Login page is the authentication gateway for AnyLet. It supports two sign-in methods (email/password and Google OAuth), handles email verification enforcement, and includes a cross-provider account linking flow for users who registered via email but attempt to sign in with Google (or vice versa). Also supports a `?next=` query parameter for post-login redirect.

## Route
`/login` — Public (unauthenticated only; redirected away if already logged in)

## What the User Can Do Here
1. Enter email and password to sign in.
2. Click "Sign in with Google" to use Google OAuth.
3. Navigate to `/forgot-password` if they forgot their password.
4. Navigate to `/signup` to create a new account.
5. Navigate back to `/` via the back arrow.
6. Resend email verification link if their email is unverified.
7. Link a Google account to an existing email/password account (account linking flow).

## Features & Functionality

### Email/Password Login
Calls `login(email, password)` from `useAuth`. After login:
- If `emailVerified` is false: signs the user out immediately and shows the "Unverified Email" state with a Resend button.
- If verified: reads the `users/{uid}` document to get `role` and `onboardingStep`, then navigates accordingly:
  - Admin → `/admin`.
  - All others → `?next=` route or `/`.

### Google OAuth Login
Calls `signInWithGoogle()` from `useAuth`. After success, similarly reads the user document and navigates. Handles:
- `auth/link-required` → Triggers the Account Linking flow.
- `auth/unauthorized-domain` → Shows a specific error for Firebase configuration issues.
- `auth/popup-blocked` → Shows a user-friendly popup blocker error.
- `auth/popup-closed-by-user` → Silently ignored.

> **Note:** Google sign-in loading state is NOT set before calling `signInWithGoogle()` because state updates can cause browsers to lose the user-interaction context and block the popup. Loading is set AFTER the popup resolves.

### Email Verification Enforcement
If the user's email is not verified, they are signed out immediately and shown an Unverified Email state. A "Resend Verification Email" button re-authenticates with their credentials, calls `sendEmailVerification`, and signs out again. Shows a "Resent" confirmation once done.

### Account Linking Flow
If Google sign-in returns `auth/link-required`, the `linkPending` state is set with the user's email and the `pendingCredential`. A secondary screen is rendered (replaces the main form) asking for the user's existing password. On submit, `linkGoogleAfterPassword` from `useAuth` links the Google credential to the existing email/password account.

### `?next=` Redirect
The route reads `searchParams.get('next')` to support deep-link redirect after login (e.g., `/login?next=/property/abc123`).

## UI Elements
- Back arrow button (navigates to `/`).
- AnyLet logo.
- Email input with Mail icon.
- Password input with Lock icon.
- Forgot Password link.
- Sign In button with loading spinner.
- Google Sign In button (with inline Google logo SVG).
- Unverified Email state with Resend button.
- Account Linking screen (conditional).
- Signup link.

## Data & State
### Firestore Collections Used
- `users` — Read (`getDoc` after login to get `role` and `onboardingStep` for redirect logic).

### Local State
- `email`, `password` — Controlled form inputs.
- `error` — String for inline error display.
- `loading`, `googleLoading` — Booleans for button loading states.
- `unverified` — Boolean for the email-not-verified state.
- `resending`, `resent` — Booleans for resend verification button.
- `linkPending` — Object `{ email, pendingCredential }` for the account linking flow.
- `linkPassword` — String for the linking password input.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `login`, `signInWithGoogle`, `linkGoogleAfterPassword`.

## Navigation
### Enters From
- Any protected route that redirects unauthenticated users.
- Signup page → "Sign in here".
- ForgotPassword page → "Back to Login".

### Exits To
- `/admin` — For admin users.
- `?next=` URL — For deep-linked redirects.
- `/` — Default for all other users.
- `/forgot-password` — Via link.
- `/signup` — Via link.
- `/` — Via back button.

## Permissions & Auth
Public access for unauthenticated users. Authenticated users should be redirected away by the router guard.

## Known Issues & What to Fix
- [ ] `handleSubmit`'s catch block has no argument (empty `catch {}`), swallowing the Firebase error code. All password login errors display the same generic message regardless of root cause (`auth/too-many-requests`, `auth/user-disabled`, etc.). — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Login.jsx:68)
- [ ] `handleResendVerification`'s catch block also has no argument, swallowing the specific error. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Login.jsx:124)
