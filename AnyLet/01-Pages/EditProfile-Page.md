---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Account-Page, ChangePassword-Page, Signup-Page]
---

# Page: EditProfile

## Purpose
Allows authenticated users to update their personal profile information: full name, phone number, WhatsApp number, location, and profile photo. Changes are saved to both Firestore (`users` collection) and Firebase Auth (`displayName`, `photoURL`).

## Route
`/edit-profile` — Requires Auth

## What the User Can Do Here
1. View and edit their full name.
2. View their email address (read-only — cannot be changed here).
3. Edit their primary phone number (11 digits required).
4. Edit their optional WhatsApp number (sanitised to digits only).
5. Edit their location (free text, e.g. "Dhaka, Bangladesh").
6. Click the Camera icon or "Change Photo" button to upload a new profile photo.
7. See an instant preview of the uploaded profile photo.
8. Submit the form to save all changes.
9. View success or error messages inline.

## Features & Functionality

### Data Fetch on Mount
Uses `getDoc(doc(db, 'users', uid))` to pre-populate all form fields with existing profile data. Falls back to `currentUser.photoURL` and `currentUser.email` for fields that may only exist in Firebase Auth.

### Phone Validation
Before saving, the phone number string is stripped of non-digit characters. If the result is not exactly 11 digits, an error message is shown and the form does not submit.

### Signed Avatar Upload (Cloudinary)
Image upload triggers a two-step process:
1. A `POST /api/cloudinary-sign` request (with Firebase Auth Bearer token) gets a signed upload payload.
2. The image is uploaded directly to Cloudinary using the signed parameters.
The returned `secure_url` is stored in `formData.photoURL` and displayed instantly as a preview. The user must click "Save Changes" to persist the new URL to Firestore.

### Firestore + Auth Sync
On save, two writes happen:
1. `setDoc(..., { merge: true })` updates the `users/{uid}` document with the new profile fields.
2. `updateProfile(auth.currentUser, {...})` syncs `displayName` and `photoURL` to Firebase Auth.
3. `refreshUser()` from `useAuth` context is called to update the app's in-memory user state.

### Loading State
Uses `EditProfileSkeleton` while the initial Firestore `getDoc` is in progress.

## UI Elements
- `EditProfileSkeleton` — [Skeleton.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/Skeleton.jsx:1) — Loading placeholder.
- Profile photo with initials fallback + camera icon upload trigger.
- Full Name, Phone, WhatsApp Number, Location inputs.
- Email input (read-only).
- Success/Error banner.
- Save button with loading state.

## Data & State
### Firestore Collections Used
- `users` — Read (`getDoc` on mount) / Write (`setDoc` with merge on save).

### Firebase Auth
- Read: `currentUser.email`, `currentUser.photoURL`.
- Write: `updateProfile` to sync `displayName` and `photoURL`.

### Local State
- `formData` — Object with `fullName`, `email`, `phone`, `whatsappNumber`, `location`, `photoURL`.
- `loading` — Boolean for initial skeleton.
- `saving` — Boolean for form submit + photo upload loading.
- `message` — Object `{ type: 'success'|'error', text: string }` for inline feedback.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser` and `refreshUser`.

## Navigation
### Enters From
- Account page → "Edit Profile" link.

### Exits To
_None identified._ (Stays on the same page after save; a commented `navigate('/profile')` exists but is disabled.)

## Permissions & Auth
- **Requires Auth:** Yes. Redirects to `/login` if `currentUser` is null.

## Known Issues & What to Fix
- [ ] The email field is read-only with no way to change it on this page. Users who wish to change their email have no clear path to do so. A "Change Email" flow should be added. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/EditProfile.jsx:240)
- [ ] Phone validation only runs at submit time, not on blur. Real-time validation would improve UX. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/EditProfile.jsx:67)
