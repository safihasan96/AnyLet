---
title: DM — Reviews
type: data-model
tags: [data-models, firestore, reviews]
status: stable
last-scanned: 2026-06-28
related: [Feature-Property-Detail, DM-properties, DM-users]
---

# `propertyReviews` and `ownerReviews` Collections

Two distinct collections handling feedback and ratings.

## `propertyReviews` Fields (Inferred)
- `propertyId` (string)
- `reviewerId` (string) — Tenant UID
- `rating` (number) — 1 to 5
- `comment` (string)
- `createdAt` (timestamp)
- `status` (string) — `published`, `hidden` (moderation)

## `ownerReviews` Fields (Inferred)
- `ownerId` (string) — Target of the review
- `reviewerId` (string) — Tenant UID
- `rating` (number) — 1 to 5
- `comment` (string)
- `createdAt` (timestamp)

## Aggregation
> [!note]
> The `stats` sub-objects on `properties` and `users` (owner profiles) are likely updated via a Cloud Function triggers or client-side batch writes when a review is submitted, to keep average ratings denormalized and fast to read.
