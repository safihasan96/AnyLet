---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Search-Page, PropertyDetails-Page, Account-Page]
---

# Page: Favorites

## Purpose
Displays all properties a user has saved/bookmarked. Allows users to quickly revisit properties they expressed interest in without re-searching. Acts as a personal shortlist for property comparison and decision-making.

## Route
`/saved` (or `/favorites`) — Requires Auth

## What the User Can Do Here
1. View a list of all their saved/hearted properties rendered as full `PropertyCard` components.
2. Click a property card to navigate to that property's detail page.
3. Click "Explore Properties" (empty state) to navigate to the Search page.
4. Interact with PropertyCard actions (like/unlike, view details) directly from this list.

## Features & Functionality

### Batched Firestore `in` Query
The page uses the `useSavedProperties` hook to retrieve the array of saved property IDs from the user's Firestore document. It then fetches the actual property documents in batches of 10 (Firestore's `in` query limit). Up to 100 favorites are supported (10 batches × 10 IDs). Each batch fires a separate `getDocs` call.

### Loading State
While `hookLoading` (from `useSavedProperties`) or the page's own `loading` is true, 3 `PropertyCardSkeleton` placeholders are rendered.

### Empty State
If the user has no saved properties, a centered illustration with a filled Heart icon, heading "Nothing Saved Yet", and a CTA button to "Explore Properties" is rendered.

## UI Elements
- `PropertyCard` — [PropertyCard.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/PropertyCard.jsx:1) — Full property card for each saved listing.
- `PropertyCardSkeleton` — [Skeleton.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/Skeleton.jsx:1) — Loading placeholder.
- Empty state card with Heart icon and "Explore Properties" CTA button.

## Data & State
### Firestore Collections Used
- `properties` — Read (batched `getDocs` using `documentId()` `in` queries).
- `users` — Read (indirectly via `useSavedProperties` hook which reads `users/{uid}.savedProperties`).

### Local State
- `favorites` — Array of fetched property documents.
- `loading` — Boolean for the property fetch loading state.

### External Hooks
- [useSavedProperties](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/hooks/useSavedProperties.js:1) — Provides `savedProperties` (array of property IDs) and `hookLoading`.
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.

## Navigation
### Enters From
- Bottom Navigation Bar (Heart/Saved tab).
- Account page.

### Exits To
- `/property/:id` — Via PropertyCard click.
- `/search` — Via "Explore Properties" empty-state button.

## Permissions & Auth
- **Requires Auth:** Yes. The hook reads from the user's Firestore document.

## Known Issues & What to Fix
- [ ] The batch query fetches are not sorted — the final `favorites` array order depends on Firestore document order, not the order the user saved them. Saved properties should be stored with timestamps to allow chronological display. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Favorites.jsx:41)
- [ ] No error state is rendered if the batch `getDocs` calls fail. The error is logged but the user sees nothing. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Favorites.jsx:59)
