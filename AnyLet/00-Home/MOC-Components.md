---
title: MOC — Components
type: architecture
tags: [moc, components]
status: stable
last-scanned: 2026-06-28
related: [Home]
---

# MOC — Components

Logic-bearing shared components only. Trivial presentational wrappers excluded.

| Component           | Note                              | Role                                  |
| ------------------- | --------------------------------- | ------------------------------------- |
| Header              | [[Component-Header]]              | Sticky desktop nav                    |
| BottomNav           | [[Component-BottomNav]]           | Mobile tab bar                        |
| MobileNavBar        | [[Component-MobileNavBar]]        | Mobile top nav                        |
| PropertyCard        | [[Component-PropertyCard]]        | Listing card with image slider        |
| PaymentModal        | [[Component-PaymentModal]]        | Full payment flow UI                  |
| BookPropertyModal   | [[Component-BookPropertyModal]]   | Escrow booking flow                   |
| WriteReviewModal    | [[Component-WriteReviewModal]]    | Review submission                     |
| MoveInModal         | [[Component-MoveInModal]]         | Move-in confirmation flow             |
| KYCVerification     | [[Component-KYCVerification]]     | KYC document upload                   |
| ViewingRequestModal | [[Component-ViewingRequestModal]] | Request viewing form                  |
| Skeleton            | [[Component-Skeleton]]            | Loading skeletons (multiple variants) |
| ProtectedRoute      | [[Component-ProtectedRoute]]      | Auth guard wrapper                    |
| AdminRoute          | [[Component-AdminRoute]]          | Admin auth guard                      |
| OnboardingGuard     | [[Component-OnboardingGuard]]     | Onboarding completion check           |
| ErrorBoundary       | [[Component-ErrorBoundary]]       | React error boundary                  |
| PageWrapper         | [[Component-PageWrapper]]         | Page transition animation wrapper     |
| PropertyMap         | [[Component-PropertyMap]]         | Leaflet map for single property       |
| ShareModal          | [[Component-ShareModal]]          | Property share sheet                  |
| PhoneVerifyModal    | [[Component-PhoneVerifyModal]]    | Phone OTP verification                |
| InvoiceModal        | [[Component-InvoiceModal]]        | Payment invoice generator             |
