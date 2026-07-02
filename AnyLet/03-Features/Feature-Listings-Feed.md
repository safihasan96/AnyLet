---
title: Feature — Property Listings Feed
type: feature
tags: [features, feed, properties]
status: stable
last-scanned: 2026-06-28
related: [DM-properties, Feature-Search, Component-PropertyCard]
---

# Feature: Property Listings Feed

The primary content discovery mechanism on the Home page. 

## Files Involved
- `src/pages/Home.jsx`
- `src/components/PropertyCard.jsx`

## Architecture
- **Data Fetching**: Queries `properties` collection `where('status', '==', 'available')`, ordered by `createdAt` descending.
- **Card Component**: The feed relies entirely on `PropertyCard.jsx`, a dense, interactive component that handles:
  - Multi-image swipeable carousel (Framer Motion).
  - Price formatting.
  - "Save to Favorites" heart toggle.
  - Badges for verification/premium status.
- **Lazy Rendering**: The feed likely leverages intersection observers or pagination to prevent DOM bloat on long scrolls (verify implementation in `safeQuery.js`).
