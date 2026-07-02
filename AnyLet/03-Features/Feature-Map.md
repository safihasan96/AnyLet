---
title: Feature — Map Discovery
type: feature
tags: [features, map, leaflet, geospatial]
status: stable
last-scanned: 2026-06-28
related: [DM-properties]
---

# Feature: Map Discovery

Full-screen map view for discovering properties geographically.

## Files Involved
- `src/pages/MapPage.jsx`
- `src/components/map/MapMarker.jsx` (Inferred via Leaflet usage)

## Stack
- `leaflet`
- `react-leaflet`
- `react-leaflet-cluster`

## Architecture & Performance
- **Heavy Dependency Isolation**: Map libraries (Leaflet) add significant weight to the JS bundle. To prevent this from slowing down the initial app load, the Map page is lazy-loaded (`lazy(() => import('./pages/MapPage'))`) and bundled into a separate manual chunk (`vendor-leaflet`).
- **Layout Exclusion**: `MapPage` is intentionally excluded from the standard `PageWrapper` and standard margins in `App.jsx` to ensure it can consume the full viewport `100dvh` (excluding the `BottomNav` on mobile).
- **Clustering**: Utilizes `react-leaflet-cluster` to combine dense markers into a single numeric bubble when zoomed out, preventing DOM lag.
