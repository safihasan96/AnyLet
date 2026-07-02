---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [PropertyDetails-Page, AddProperty-Page, Account-Page]
---

# Page: MyListings

## Purpose
The primary dashboard for landlords and property owners to manage their property listings. Users can view all their active and pending listings, search through them, filter by status, and perform actions on individual listings such as editing details, changing status, bumping (refreshing), requesting verification, and deleting.

## Route
`/my-properties` (or similar) — Requires Auth

## What the User Can Do Here
1. View a list of all properties they own (where they are `ownerId`, `landlordId`, `userId`, or `creatorId`).
2. See top-level metrics: Total Listings, Active, and Pending counts.
3. Search properties by title or location (area/district/upazila).
4. Filter properties by status: All, Active, Pending.
5. Click a property card to navigate to its public detail page.
6. Click the options (⋮) menu on a property card to open the action bottom sheet.
7. From the bottom sheet:
   - **View Listing**: Open the property details page.
   - **Edit Details**: Navigate to the edit property form.
   - **Change Status**: Toggle status between 'Available' and 'Under Negotiation'.
   - **Bump Listing**: Refresh the listing's `updatedAt` date so it appears higher in search results and resets its 365-day expiry timer.
   - **Request Verification**: Pay a verification fee (if unverified) to get an onsite agent visit.
   - **Delete Listing**: Permanently remove the listing.
8. Click the property ID badge to copy the full ID to the clipboard.
9. Automatically triggers an expiry warning email if a listing hasn't been updated in 365 days.

## Features & Functionality

### Real-Time Listings Query
An `onSnapshot` listener fetches all documents from the `properties` collection. It filters client-side to only keep listings where the current user is the owner/creator. Results are sorted by `createdAt` descending.

### 365-Day Expiry Check
A `useEffect` hook iterates over the user's listings. If a listing hasn't been updated in 365 days and hasn't had an expiry email sent (`expiryEmailSent: false`), it calls `sendListingExpiryEmail()` and updates the Firestore document with `expiryEmailSent: true`.

### Action Bottom Sheet
Uses a Framer Motion animated bottom sheet drawer (`bottomSheet` state) triggered by the (⋮) menu on a listing card. Contains all property management actions.

### Action Modals
- **Delete**: Opens `ConfirmationModal`. On confirm, calls `deleteDoc`.
- **Status Change**: Opens `ConfirmationModal`. Toggles between 'Available' and 'Under Negotiation'.
- **Bump**: Opens `ConfirmationModal`. Updates `updatedAt` to `serverTimestamp()` and resets `expiryEmailSent` to `false`.
- **Verify**: Opens `PaymentModal` for the 199 BDT Onsite Verification fee. On success, updates `verificationStatus` to 'pending' and stores the `verificationPaymentId`.

### Metrics & Filtering
Calculates "Active" (approved and Available) vs "Pending" (not approved or not Available) counts based on local state. Search input performs local text matching on title and location fields.

## UI Elements
- `Skeleton` — Loading state for listing cards.
- `MetricCard` — Small top stat cards.
- `ListingCard` — Property card showing image, title, location, rent, status badge, and ID copy button.
- Animated Bottom Sheet drawer (Framer Motion).
- `ConfirmationModal` — Used for Delete, Status Change, and Bump actions.
- `PaymentModal` — Used for the Verification fee flow.

## Data & State
### Firestore Collections Used
- `properties` — Read (real-time via `onSnapshot`) / Write (`updateDoc` for status/bump/verify, `deleteDoc` for delete).

### Local State
- `listings` — Array of user's property documents.
- `loading` — Boolean for skeleton state.
- `searchQuery` — String for the search filter.
- `activeFilter` — String ('All', 'Active', 'Pending').
- `bottomSheet` — Object `{ isOpen, property }` for the action drawer.
- Modals state: `deleteModal`, `statusModal`, `bumpModal`, `verifyModal` (all objects tracking `isOpen`, `id`, `title`, etc.).
- Processing flags: `isDeleting`, `isUpdatingStatus`, `isBumping`.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1) — Toast notifications.

## Navigation
### Enters From
- Account page → "My Properties" link.

### Exits To
- `/property/:id` — Via card click or "View Listing".
- `/edit-property/:id` — Via "Edit Details".
- `/post-ad` — Via "Post New Ad" button (when empty).

## Permissions & Auth
- **Requires Auth:** Yes. Redirects to `/login` if `currentUser` is null.
- **Data Filtering:** Fetches all properties but filters client-side by checking multiple ID fields (`ownerId`, `landlordId`, `userId`, `creatorId`).

## Known Issues & What to Fix
- [ ] **Performance/Security:** The query fetches `collection(db, 'properties')` without a `where` clause and filters client-side. This means the client downloads EVERY property in the entire database before filtering. This is a severe performance issue and potential data exposure. It must be updated to use a `where` clause on the query itself. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/MyListings.jsx:46)
- [ ] The expiry check logic runs on the client side every time the page is opened. If the user doesn't open this page, the expiry email is never sent. This logic should be moved to a scheduled backend Cloud Function or cron job. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/MyListings.jsx:75)
