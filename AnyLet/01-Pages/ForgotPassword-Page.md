---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Login-Page, Signup-Page, ChangePassword-Page]
---

# Page: ForgotPassword

## Purpose
Provides a self-service password recovery flow for users who cannot access their account. The user enters their registered email and Firebase sends a reset link. It has two distinct visual states: the email input form and a post-submission success confirmation.

## Route
`/forgot-password` — Public (accessible without authentication)

## What the User Can Do Here
1. Enter their registered email address in the form.
2. Click "Send Reset Link" to trigger a Firebase password reset email.
3. View inline error messages for invalid email or non-existent account.
4. On success, view the confirmation screen showing which email the link was sent to.
5. Navigate back to `/login` from the success screen.
6. Click "Use a different email" on the success screen to reset the form.
7. Click "Back to Login" link at the bottom of the form to return to the login page.
8. Click the back button to navigate to the previous page.

## Features & Functionality

### Firebase Password Reset Email
Calls `sendPasswordResetEmail(auth, email)` from Firebase Auth. On success, `sent` is set to `true` and the component renders the success state. On failure, specific error codes are handled:
- `auth/user-not-found` → "No account found with this email address."
- `auth/invalid-email` → "Please enter a valid email address."
- Any other error → "Something went wrong. Please try again."

### Success State
A visually distinct success screen replaces the form entirely. It shows a pulsing emerald `CheckCircle2` animation, the email address that was used (rendered from state), instructional copy, and two buttons: "Back to Login" and "Use a different email" (resets the `sent` state).

### Form State
Standard email input with a loading spinner (`RefreshCw animate-spin`) on the submit button while the Firebase call is in-flight.

## UI Elements
- Logo (HomeIcon in primary colour rounded square).
- Mail icon.
- Email input with icon prefix.
- Error banner.
- Submit button with spinner loading state.
- Back navigation button (`navigate(-1)`).
- Success screen with animated pulsing ring.

## Data & State
### Firestore Collections Used
_None identified._ (Only Firebase Auth is used.)

### Local State
- `email` — Controlled string input.
- `loading` — Boolean for submit button state.
- `error` — String for error display.
- `sent` — Boolean toggling between form view and success view.

### External Hooks
_None identified_ (does not use `useAuth` context; uses `auth` directly from `firebase.js`).

## Navigation
### Enters From
- Login page → "Forgot Password?" link.

### Exits To
- `/login` — Via success screen "Back to Login" button or form link.
- Previous page — Via back button (`navigate(-1)`).

## Permissions & Auth
Public access. No auth guard required. Unauthenticated users only.

## Known Issues & What to Fix
- [ ] Firebase no longer returns `auth/user-not-found` for security reasons in newer SDK versions (it silently succeeds even if the email doesn't exist). The error handler for this code may never actually fire, meaning users with typos in their email see a false success state. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/ForgotPassword.jsx:24)
