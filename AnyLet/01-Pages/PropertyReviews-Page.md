---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [PropertyDetails-Page, OwnerProfile-Page]
---

# Page: PropertyReviews

## Purpose
A dedicated, deep-dive page displaying all verified reviews for a specific property. It provides aggregate statistical summaries (average rating, distribution, category scores) and lists all individual review cards.

## Route
`/property/:id/reviews` — Publicly accessible

## What the User Can Do Here
1. View the property title and its aggregate review statistics (Overall Score out of 5.0).
2. See a visual breakdown of rating distributions (how many 5-star, 4-star, etc., with animated progress bars).
3. View category-specific averages (Location, Value, Cleanliness, Accuracy, Communication).
4. Read individual review cards left by verified tenants.
5. Vote a review as "Helpful" (requires authentication).
6. (If logged in as the property owner) Post a public reply to any review.

## Features & Functionality

### Concurrent Data Fetching
`useEffect` queries both the `properties` document (for the title) and the `propertyReviews` collection (`propertyId == id`, `isApproved == true`). Results are sorted chronologically descending.

### Statistical Aggregation
The `useMemo` hook computes complex statistics on the fly from the fetched reviews:
- `overallAvg`: Simple mean of all `rating` values.
- `catAvgs`: Mean scores per category.
- `distribution`: Percentage and count breakdown for 1 to 5 stars.

### Review Interactions
- **Helpful Votes:** Same optimistic UI pattern as `OwnerProfile`, using `toggleHelpfulVote` from `reviewService.js`.
- **Landlord Replies:** Owners can reply inline. Submits via `submitLandlordReply` from `reviewService.js` and immediately updates the local state.

### Animations
Extensive use of Framer Motion:
- The rating distribution bars grow from `width: 0` to their calculated percentage.
- Review cards slide and fade up with staggered delays.

## UI Elements
- `ReviewsSkeleton` — Custom loading state.
- Rating Summary Card (Big score, Star distribution bars, Category grids).
- `ReviewCard` — Sub-component displaying the avatar, rating, text, helpful button, and optional landlord reply block.

## Data & State
### Firestore Collections Used
- `properties` — Read (`getDoc` by `id`).
- `propertyReviews` — Read (query by `propertyId`) / Write (via `reviewService` for votes/replies).

### Local State
- `property` — Object containing property data (mainly for title).
- `reviews` — Array of approved review documents.
- `loading` — Boolean for skeleton state.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1) — Toast notifications.

## Navigation
### Enters From
- `PropertyDetails` page → "Read all reviews" button.

### Exits To
- `/property/:id` — Via the "Back to Property" button.
- `/login` — If attempting restricted actions while logged out.

## Permissions & Auth
- **Public Profile:** Unauthenticated users can read all reviews.
- **Protected Actions:** Voting on a review redirects unauthenticated users to `/login`. Replying to a review requires the user's UID to match `property.userId` or `property.ownerId`.

## Known Issues & What to Fix
- [ ] No explicit 404 routing. If an invalid `id` is passed, it just shows a raw "Property not found" message. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/PropertyReviews.jsx:156)
