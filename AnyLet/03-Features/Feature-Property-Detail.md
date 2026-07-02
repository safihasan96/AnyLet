---
title: Feature — Property Detail
type: feature
tags: [features, property-detail, enquiry]
status: stable
last-scanned: 2026-06-28
related: [DM-properties, DM-viewing-requests, Component-BookPropertyModal]
---

# Feature: Property Detail

Displays individual listing details, photo gallery, location, and acts as the entry point for tenant actions (Booking, Enquiring, Reporting).

## Files Involved
- `src/pages/PropertyDetails.jsx`
- `src/components/PropertyMap.jsx`
- `src/components/BookPropertyModal.jsx`
- `src/components/ViewingRequestModal.jsx`
- `src/components/ReportProperty.jsx`
- `src/pages/PropertyReviews.jsx`

## Collections Touched
- `properties` (Read)
- `users` (Read owner profile)
- `viewing_requests` (Write)
- `paymentIntents` (Write via Booking flow)
- `reports` (Write)

## Actions Available
1. **Request Viewing**: Opens `ViewingRequestModal`, writes to `viewing_requests`.
2. **Book Now**: Opens `BookPropertyModal` → Escrow payment flow.
3. **Save**: Toggles property in user's saved/favorites array.
4. **Share**: Opens `ShareModal` (uses native Web Share API where available).
5. **Report**: Navigates to `/report-property/:id`.

## Desktop Responsiveness
Upgraded to a 2-column layout on large screens. Image gallery and description on the left; Action card (price, booking button, owner info) sticky on the right.
