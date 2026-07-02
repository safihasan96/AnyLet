---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Account-Page, Login-Page, Settings-Page]
---

# Page: ChangePassword

## Purpose
Allows authenticated users to securely change their account password. Implements a critical security pattern: the user must prove identity by re-entering their current password before the new password is accepted, and is then automatically signed out of all sessions upon success.

## Route
`/change-password` — Requires Auth

## What the User Can Do Here
1. Enter their current password (with show/hide toggle).
2. Enter a new password (with show/hide toggle).
3. Enter the new password again to confirm (with show/hide toggle).
4. Submit the form to update the password.
5. View inline error messages if the current password is wrong or passwords don't match.
6. Read an informational notice that changing the password will sign them out of all other devices.

## Features & Functionality

### Re-authentication Before Change
The form calls `reauthenticateWithCredential` using `EmailAuthProvider.credential(email, currentPassword)` before allowing the password update. This prevents account takeover if a device is left unlocked.

### Client-Side Validation
Before making any Firebase calls:
- Checks that `newPassword === confirmPassword` — shows error if not.
- Checks that `newPassword.length >= 8` — shows error if too short.

### Firebase Auth Password Update
On successful re-authentication, calls `updatePassword(currentUser, newPassword)` to update the credential in Firebase Auth.

### Forced Sign-Out After Change
After the password update, calls `signOut(auth)` and navigates the user to `/login`. This terminates the current session and prevents stale JWT tokens from being used.

### Error Handling
Catches `auth/invalid-credential` and `auth/wrong-password` error codes and displays a friendly "Incorrect current password" message. All other errors show a generic retry message.

### Show/Hide Toggles
Each of the three password inputs has an independent eye icon toggle (`EyeOff` / `Eye`) to reveal or mask the password characters.

## UI Elements
- Three password input fields, each with a Lucide icon prefix and a show/hide toggle button.
- Inline error banner (`rose-50` background) for validation and API errors.
- Info notice box explaining the sign-out-on-change behaviour.
- Submit button with loading state (`"UPDATING..."` text while in progress).

## Data & State
### Firestore Collections Used
_None identified._ (This page only interacts with Firebase Auth, not Firestore.)

### Local State
- `currentPassword`, `newPassword`, `confirmPassword` — Controlled string inputs.
- `showCurrent`, `showNew`, `showConfirm` — Booleans for password visibility.
- `error` — String for inline error display.
- `loading` — Boolean for submit button disabled/loading state.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser` (used for email and to pass to Firebase auth functions).

## Navigation
### Enters From
- Account / Settings page → "Change Password" link.

### Exits To
- `/login` — Automatically after a successful password change.

## Permissions & Auth
- **Requires Auth:** Yes. `currentUser` is expected by the page; if null, the re-auth step will fail.
- Note: No explicit redirect guard is present in this component. The router-level `ProtectedRoute` is relied upon.

## Known Issues & What to Fix
- [ ] The password strength validator only checks minimum length (8 chars). No check is made for uppercase, special characters, or commonly-used passwords. A password strength meter would improve security. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/ChangePassword.jsx:31)
- [ ] If a user signs up with Google OAuth (no email/password credential), `reauthenticateWithCredential` will fail. No handling exists for this case; the user should be redirected or informed. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/ChangePassword.jsx:40)
