---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Signup-Page, Login-Page]
---

# Page: VerifyEmail

## Purpose
A gateway page that interrupts the user journey immediately after registration (via Email/Password) to enforce email verification. Users cannot access authenticated routes until their Firebase Auth profile reflects `emailVerified: true`.

## Route
`/verify-email` — Requires Auth (but specifically targeting unverified users)

## What the User Can Do Here
1. See which email address the verification link was sent to.
2. Click "I've Verified" to refresh their auth token and check if verification was successful.
3. Click "Resend Verification Link" if they didn't receive the email.
4. Sign out and log in with a different account.
5. If already verified, view a success screen and click "Go to Homepage".

## Features & Functionality

### State Hydration & Protection
Uses `useAuth` to get the `currentUser`. If no user is logged in, they are immediately bounced to `/login`. If the user is already verified, it renders the success view instead of the pending view.

### Verification Check (`handleCheckStatus`)
Calls `refreshUser()` (a context method wrapping `currentUser.getIdToken(true)` or similar) to force Firebase to fetch the latest user claims. If `emailVerified` is true, local state updates and unblocks the user. If false, shows a warning toast.

### Resend Email (`handleResend`)
Invokes Firebase's `sendEmailVerification(auth.currentUser)`. Features a 5-second cooldown/success state ("Email Sent!") to prevent spam clicking.

## UI Elements
- Large, animated alert icons (`Mail` for pending, `CheckCircle2` for success).
- Warning callout regarding Spam/Junk folders.
- Loading spinners (`RefreshCw` animated) on buttons during async operations.
- Framer Motion scale and fade animations for the success state overlay.

## Data & State
### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Uses `currentUser`, `logout`, and `refreshUser`.
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1)

### Local State
- `sending`, `sent` — Controls the resend button UI and throttling.
- `refreshing` — Controls the status check button spinner.
- `isVerified` — Boolean derived from `currentUser.emailVerified` dictating which layout to render.

## Navigation
### Enters From
- `Signup` — Redirected here immediately after creating an Email/Password account.
- `PrivateRoute` / `App.jsx` router — Often intercepts unverified users trying to access protected routes.

### Exits To
- `/` (Home) — Upon successful verification.
- `/login` — If the user chooses to sign out.

## Permissions & Auth
- Interacts strictly with the Firebase Auth instance.
- Users stuck on this page can only interact with their own email verification status.
