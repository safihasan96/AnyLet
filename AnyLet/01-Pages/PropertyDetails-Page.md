---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [BookPropertyModal-Component, ViewingRequestModal-Component, ConfirmationModal-Component, ShareModal-Component]
---

# Page: PropertyDetails

## Purpose
The primary showcase page for an individual property listing. Displays comprehensive details, high-quality image galleries, features, landlord contact options, rental history trust badges, and initiates core conversion flows (Booking, Requesting Viewings, or WhatsApp contact).

## Route
`/property/:id` — Publicly accessible (but interactive actions require Auth)

## What the User Can Do Here
1. View an interactive, draggable image gallery.
2. Read the property's title, price (rent/billing cycle), address, and area size.
3. Check verification statuses (Property Verified, Landlord Verified, Onsite Verified).
4. See if the property is "Available", "Booked", or "Let Agreed" (with respective colour-coded badges).
5. Open the map view centred on this property.
6. Pay a security deposit to instantly book the property via AnyLet Escrow (`BookPropertyModal`).
7. Send a viewing request to the owner (`ViewingRequestModal`).
8. Call the owner natively or text them on WhatsApp.
9. View the owner's basic info and navigate to their full profile (`OwnerProfile`).
10. Read property specifications (Floor, Parking, Pet/Bachelor/Family policies) and nearby amenities.
11. Jump to the `PropertyReviews` page to read guest reviews.
12. Share the listing URL or report the ad for policy violations.

## Features & Functionality

### Dynamic Image Gallery
- Uses `Framer Motion` for a draggable, swipeable image slider.
- Optimises images on the fly via `getOptimizedImageUrl(url, 1200)`.
- Calculates swipe velocity and offset to paginate left/right.

### Dual-Query Analytics
- Fetches the `rentHistoryCount` by querying the `tenantMoveIns` collection.
- Fetches the current user's past `viewing_requests` (limited to 50) to check if they've requested this property within the last 48 hours. If yes, it disables the "Request Viewing" button to prevent spam.

### Viewing Request Flow
- Clicking "Request Viewing" opens `ViewingRequestModal`.
- On submit:
  1. Creates a `viewing_requests` document.
  2. Uses `getOrCreateConversation` (from `messageService.js`) to set up a chat between the tenant and the owner.
  3. Links the conversation ID to the request.
  4. Triggers an in-app `createNotification` for the owner.

### Smart Contact Generation
- **WhatsApp (`waUrl`):** Takes the owner's phone number, sanitises it, forces a Bangladeshi country code if necessary, and generates a pre-filled WhatsApp `wa.me` deep link.
- **Direct Call:** Validates that the tenant's email is verified before opening the `ConfirmationModal` to trigger `tel:`.

### Escrow Booking CTA
If the property has a `securityDeposit > 0` and is available (and the viewer is not the owner), a prominent, highly styled gradient banner encourages instant booking.

## UI Elements
- `PropertyDetailSkeleton` — Loading state.
- Sticky Action Bar — (Right side on desktop, bottom on mobile).
- Custom `SpecItem` and `DistanceBadge` sub-components.
- Interactive Framer Motion UI (Carousels, Pulse effects on CTAs, spring-loaded hovers).

## Data & State
### Firestore Collections Used
- `properties` — Read (`getDoc` by `id`).
- `users` — Read (`getDoc` to fetch owner info).
- `tenantMoveIns` — Read (count successful rentals).
- `viewing_requests` — Read (spam check) / Write (new request).
- `notifications` — Write (notify owner).

### Local State
- `property`, `owner` — Data objects.
- `loading` — Boolean for skeleton state.
- `activeImage`, `slideDirection` — Integers for gallery state.
- `requestSending`, `requestSent` — Booleans for CTA state.
- `isModalOpen`, `callModalOpen`, `shareModalOpen`, `bookModalOpen` — Modal toggles.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1)
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1)
- [useLanguage](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/LanguageContext.jsx:1)

## Navigation
### Exits To
- `/map` — Passing the `centerProperty` in router state.
- `/owner/:id` — To the landlord's profile.
- `/property/:id/reviews` — To the full reviews page.
- `/report-property/:id` — To flag the listing.
- `/login` — If attempting restricted actions while logged out.
- `/messages/:convId` (indirectly) — The notification sends the owner to the chat.

## Known Issues & What to Fix
- [ ] The `useEffect` fetching logic does not abort if the component unmounts. Standard React cleanup (AbortController or an `isMounted` flag) should be implemented to prevent state updates on unmounted components. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/PropertyDetails.jsx:125)
