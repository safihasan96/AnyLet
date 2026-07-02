---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [MyMoveIns-Page, PropertyDetails-Page, OwnerProfile-Page]
---

# Page: MyReviews

## Purpose
Allows users to view a consolidated list of all the reviews they have written across the platform. This includes reviews written for properties (e.g., after moving in) and reviews written for owners/landlords.

## Route
`/my-reviews` (or similar) — Requires Auth

## What the User Can Do Here
1. View a list of all reviews they've authored, sorted by newest first.
2. Differentiate between Property Reviews and Owner Reviews via icons and labels.
3. See their given star rating, review text, and the date the review was created.
4. View landlord/owner replies to their reviews inline (if replied).
5. Click on a review card to navigate to the respective Property or Owner profile page.
6. If no reviews exist, see an animated empty state with an "Explore Properties" button.

## Features & Functionality

### Dual-Collection Query
Fetches data from two separate Firestore collections simultaneously:
1. `propertyReviews` where `reviewerId == currentUser.uid`
2. `ownerReviews` where `reviewerId == currentUser.uid`
The results are mapped to include a `type: 'property' | 'owner'` field, combined into a single array, and sorted by `createdAt` descending before being stored in state.

### Framer Motion Animations
- `pageVariants`, `headerVariants`, `itemVariants` for staggered list entrance.
- `starContainerVariants`, `starVariants` for animated star rating rendering (stars pop in sequentially).
- Pop layout exit animations.

### Review Card Component
A highly interactive card that displays:
- Icon (Building for property, User for owner).
- Target Name (`propertyName` or `ownerName`).
- Badge specifying the type of review.
- Date formatting (`en-GB` format: DD MMM YYYY).
- 5-Star visual rating component.
- The review text block.
- An inline landlord reply block (rendered in a green tint if `landlordReply` exists on the document).

## UI Elements
- `SkeletonCard` — Animated loading state.
- `ReviewCard` — Sub-component for individual review display.
- `StarRating` — Animated 5-star renderer.
- Empty State placeholder with a button navigating to `/`.

## Data & State
### Firestore Collections Used
- `propertyReviews` — Read (query by `reviewerId`).
- `ownerReviews` — Read (query by `reviewerId`).

### Local State
- `reviews` — Combined array of property and owner review documents.
- `loading` — Boolean for skeleton state.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.

## Navigation
### Enters From
- Account page → "My Reviews" link.

### Exits To
- `/property/:id` — Via clicking a Property Review card.
- `/owner/:id` — Via clicking an Owner Review card.
- `/` — Via the Empty State "Explore Properties" button.

## Permissions & Auth
- **Requires Auth:** Yes. Wait, similar to `MyPayments`, the `useEffect` just returns early if `!currentUser` but doesn't redirect.

## Known Issues & What to Fix
- [ ] No explicit authentication guard redirect. If a user lands on this page without being logged in, they see the empty state indefinitely instead of being redirected to `/login`. A `useEffect` with `navigate('/login')` should be added. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/MyReviews.jsx:140)
- [ ] The `date` calculation in `ReviewCard` assumes `createdAt.seconds` exists. If `createdAt` is a raw Date string or missing, `seconds * 1000` will result in `NaN` and default to `Date.now()`. It should robustly handle `toDate()` or standard dates. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/MyReviews.jsx:62)
