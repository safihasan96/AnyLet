---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [OwnerProfile-Page]
---

# Page: SetupOwnerProfile

## Purpose
Allows landlords/owners to set up and edit the public-facing aspects of their profile, specifically their Bio and Cover Photo. This data is displayed when tenants view their listings or their public `OwnerProfile` page.

## Route
`/setup-owner-profile` — Requires Auth

## What the User Can Do Here
1. View their current public profile layout (Avatar, Display Name, Location, Tier, Cover Photo).
2. Click "Edit Public Profile" to enter edit mode.
3. Modify their public bio text.
4. Modify their cover photo URL (Note: Currently bound to state but lacks a direct image upload UI).
5. Save changes to update their Firestore user document.

## Features & Functionality

### Data Hydration
Fetches the current user's document from the `users` collection to pre-fill the form and display read-only stats (Membership Tier, Location, Join Date, Managed Properties Count).

### Edit Mode Toggle
Changes the UI from a read-only presentation (paragraphs) to an interactive form (textarea) when `isEditing` is true. Replaces the "Edit" button with "Save" and "Cancel".

### Firestore Updates
Calls `updateDoc` on `users/{uid}` to persist `bio` and `coverPhoto` changes. On success, updates local state to reflect changes instantly without re-fetching.

## UI Elements
- `Skeleton` — Loading state matching the layout structure.
- Hero Cover Image — Renders the cover photo with a gradient overlay.
- Bento Grid Layout — Displays the Bio spanning two columns, with Quick Stats stacked in the third column.

## Data & State
### Firestore Collections Used
- `users` — Read (fetch current user) / Write (update `bio`, `coverPhoto`).

### Local State
- `userData` — Fetched user object.
- `bio`, `coverPhoto` — Form fields for the update mutation.
- `isEditing` — Boolean toggling view/edit modes.
- `propertiesCount` — Read-only stat hydrated from Firestore.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1)
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1)

## Known Issues & What to Fix
- [ ] The Cover Photo has a hover state suggesting it can be changed (`Camera` icon), but clicking it does nothing because no `onClick` handler or file picker is implemented. Needs integration with the Cloudinary upload flow. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/SetupOwnerProfile.jsx:98)
