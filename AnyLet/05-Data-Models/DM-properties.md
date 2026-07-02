---
title: DM — Properties
type: data-model
tags: [data-models, firestore, properties]
status: stable
last-scanned: 2026-06-28
related: [Feature-Listings-Feed, Feature-Search]
---

# `properties` Collection

Stores all rental listings posted by owners.

## Fields (Inferred)
- `ownerId` (string) — reference to `users` UID
- `title` (string)
- `description` (string)
- `type` (string) — e.g., `Family House`, `Bachelor Mess`, `Commercial Space`
- `price` (number)
- `location` (map) — Division, District, Area, Geo-coordinates
- `images` (array of strings) — Cloudinary URLs
- `amenities` (array of strings)
- `bedrooms` (number)
- `bathrooms` (number)
- `size` (number) — e.g., square feet
- `status` (string) — e.g., `available`, `rented`, `unlisted`
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Relationships
- **N:1** with `users` (Owner).
- **1:N** with `viewing_requests`, `propertyReviews`, `reports`, `escrowDeposits`.
