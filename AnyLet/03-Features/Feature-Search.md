---
title: Feature — Property Search & Filters
type: feature
tags: [features, search]
status: stable
last-scanned: 2026-06-28
related: [Feature-Listings-Feed, DM-properties]
---

# Feature: Property Search & Filters

Allows tenants to discover properties by division, category, price, and amenities.

## Files Involved
- `src/pages/Search.jsx`
- `src/components/SearchCard.jsx`
- `src/utils/safeQuery.js`

## Collections Touched
- `properties` (Read-only)

## User Flow

```mermaid
flowchart TD
    A[User enters /search] --> B[Load query params]
    B --> C[Execute Firestore Query]
    
    C --> D{Apply Filters}
    D --> E[Category]
    D --> F[Division / Location]
    D --> G[Price Range]
    D --> H[Amenities]
    
    E & F & G & H --> I[Update URL params]
    I --> C
```

## Edge Cases Handled in Code
- **URL Sync**: Filter state is aggressively synced to the URL `searchParams`. This allows users to share a link to a specific filtered view (e.g. `?division=Dhaka&maxPrice=15000`).
- **Responsive Layout**: On mobile, filters live inside a slide-up bottom sheet. On desktop, they snap into a persistent left-hand sidebar (`--spacing-sidebar-w`).
- **Pagination / Limits**: Handled gracefully with `safeQuery` utility to prevent aggressive read billing on large datasets.
