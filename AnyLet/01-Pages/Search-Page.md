---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [HorizontalPropertyCard-Component, useInfiniteScroll-Hook]
---

# Page: Search

## Purpose
The primary discovery interface for tenants to find properties. It provides a robust, real-time filtering system with both server-side pagination and client-side granular filtering, complete with a persistent recent searches feature.

## Route
`/search` — Publicly accessible

## What the User Can Do Here
1. Perform free-text searches across property titles and locations.
2. View and manage their recent search history (saved to `localStorage`).
3. Filter properties by:
    - Location (Division, District, Upazila)
    - Property Type, Tenant Type
    - Price Range (Min/Max)
    - Specifications (Beds, Baths)
    - Amenities & Features
4. Scroll infinitely to load more results as they browse.
5. On mobile, open a modal drawer to access all filters.

## Features & Functionality

### Hybrid Filtering Architecture (Crucial for Firestore)
Because Firestore limits compound queries with inequality and multiple arrays, the search logic uses a hybrid approach:
1. **Server-Side (`buildServerQuery`):** Pushes the most selective, equality-based filters (Division, District, Upazila, Type) to the Firestore query to minimise bandwidth. Always includes `where('isApproved', '==', true)`.
2. **Client-Side (`filteredProperties` useMemo):** Applies the remaining complex filters (Price range, Text search, Array-contains for utilities/features, Age of listing limit).

### Infinite Scroll
Utilises the custom `useInfiniteScroll` hook. When the user scrolls near the bottom of the rendered list (triggering the `sentinelRef`), it increments the `displayCount` state by 12, revealing more properties from the already-fetched or freshly-fetched pool.

### Search History
- Saves successful searches (on Enter key or blur) to `localStorage` under `anylet_search_history`.
- Capped at 5 unique entries (LIFO).
- Users can click chips to re-search or click the 'X' to remove individual entries.

### Location Data Integration
Uses the static `bdLocations` object to dynamically populate dependent dropdowns (e.g., selecting a Division populates valid Districts; selecting a District populates valid Upazilas).

## UI Elements
- `PropertyCardSkeleton` — Loading state (Grid).
- Desktop Sidebar — Sticky left rail for filters.
- Mobile Filter Drawer — Slide-up bottom sheet for filters on small screens.
- Search Input with embedded history dropdown.
- `HorizontalPropertyCard` — Renders individual results.
- `Counter` and `ToggleButton` — Custom animated inputs for specs.

## Data & State
### Firestore Collections Used
- `properties` — Read (`getDocs` with compound queries and pagination cursors).

### Local State
- `filterState` — Object containing all active filter values.
- `searchTerm`, `searchHistory`, `inputFocused` — Text search state.
- `properties` — The raw array of fetched documents.
- `displayCount` — Integer controlling client-side pagination limit.

### Route State
- Can accept initial filter values via `location.state` (e.g., from the Home page quick search).

## Navigation
### Exits To
- `/property/:id` — Clicking a property card navigates to its detail view.

## Permissions & Auth
- **Public:** No authentication required.
- **Security:** Relies on Firestore rules to only allow reading properties where `isApproved == true`.

## Known Issues & What to Fix
- [ ] Client-side filtering can become a bottleneck if the server returns thousands of documents. Currently, the server fetches 60 at a time, but if a user keeps scrolling, the client holds all of them in memory and recalculates the `useMemo` on every render.
