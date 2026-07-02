---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Search-Page, PropertyDetails-Page, Notifications-Page, AddProperty-Page, Favorites-Page]
---

# Page: Home

## Purpose
The Home page is the primary entry point and marketing face of AnyLet. It presents the platform's hero headline, a global property search bar, a scrollable category filter, and the Featured Listings section. It is fully bilingual (via the `useLanguage` context) and uses Framer Motion for entrance animations that adapt to the user's device and motion preferences.

## Route
`/` (index route) — Public (accessible without authentication)

## What the User Can Do Here
1. Select a division (e.g. Dhaka, Chittagong) from the mobile header's location dropdown.
2. Click the search bar / "Search" button to navigate to the Search page with the selected division pre-applied.
3. View the notification bell icon (mobile header) with a live unread badge if there are unread notifications.
4. Navigate to Notifications page via the bell icon.
5. Filter the Featured Listings by category (All, Apartment, Room, Sublet, Mess, House, Cottage, Hotel, Resort, Commercial Space, Land, Shop, Others) via the category pills.
6. Scroll through the Featured Listings component.
7. View the hero illustration (desktop only).

## Features & Functionality

### Unread Notification Badge
If the user is logged in, a `onSnapshot` listener is attached to the `notifications` collection filtered by `userId == currentUser.uid` and `isRead == false`. If any unread notifications exist, a red dot badge is rendered on the Bell icon.

### Hero Search Bar
A large, pill-shaped search bar (divided into a location `<select>` and a search area). Clicking the search area or the "Search" button navigates to `/search` with the `division` passed as `location.state`. It does not perform any query on the Home page itself — all search logic lives in the Search page.

### Category Filter
A horizontally scrollable row of `CategoryItem` buttons (local sub-component) allows users to visually select a property category. The selected category value is passed as a prop to `FeaturedListings` which handles the Firestore query.

### FeaturedListings Component
The main data-heavy section is delegated to the `FeaturedListings` component. The Home page passes `category` and `division` as props.

### Animations
Uses multiple Framer Motion variants (`containerVariants`, `textVariants`, `searchBarVariants`) for entrance animations. On desktop, `slideFromLeft` and `slideFromRight` variants animate the hero text and illustration respectively. The `useAnimationSafe()` hook prevents animations from running if the device is under performance stress.

### i18n
All visible text strings (hero title, search placeholder, "Categories", etc.) are rendered through the `t()` function from `useLanguage`, supporting English and Bengali.

### SEO
Uses `<Helmet>` to set the page title and meta description for search engine indexing.

## UI Elements
- Mobile sticky header (hidden on desktop) with location select and notification bell.
- Hero text block with i18n strings.
- Hero illustration image (`/hero-illustration.png`, desktop only).
- Hero search bar (division select + search click area + search button).
- Category pills scrollable row (`CategoryItem` sub-component).
- `FeaturedListings` — [FeaturedListings.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/FeaturedListings.jsx:1) — Real-time property listings.

## Data & State
### Firestore Collections Used
- `notifications` — Read (real-time via `onSnapshot`, filtered by `userId` and `isRead: false`) — Used only to power the unread badge.

### Local State
- `hasUnread` — Boolean for the notification bell badge.
- `selectedDivision` — String for the location filter (passed to Search and FeaturedListings).
- `selectedCategory` — String for the active category filter pill.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.
- [useLanguage](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/LanguageContext.jsx:1) — Provides the `t()` translation function.
- [useAnimationSafe](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/hooks/useAnimationSafe.js:1) — Determines if animations should run.
- [useIsDesktop](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/hooks/useMediaQuery.js:1) — Media query hook for desktop detection.

## Navigation
### Enters From
- Root URL `/` — Default landing.
- Any "Home" link in navigation.

### Exits To
- `/search` — Via search bar (with `division` state).
- `/notifications` — Via bell icon.

## Permissions & Auth
Public access. No auth guard required. Notification badge only appears if user is authenticated.

## Known Issues & What to Fix
- [ ] The notification badge listener has no `limit()` constraint. For a user with many unread notifications, this could fetch a large snapshot. A `limit(1)` query is sufficient to determine if any exist. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Home.jsx:59)
- [ ] The `selectedDivision` filter is not wired to `FeaturedListings` — only `selectedCategory` and `division` are passed as props; however `division` is passed as `selectedDivision`. Verify that `FeaturedListings` actually uses the `division` prop to filter Firestore queries.
