---
title: MOC — Pages & Routes
type: architecture
tags: [moc, pages, routes]
status: stable
last-scanned: 2026-06-28
related: [Home]
---

# MOC — Pages & Routes

42 routes total · 19 public · 22 protected · 1 admin

## Public Routes

| Route | Page Note | File |
|-------|-----------|------|
| `/` | [[Home-Page]] | `src/pages/Home.jsx` |
| `/search` | [[Search-Page]] | `src/pages/Search.jsx` |
| `/property/:id` | [[PropertyDetails-Page]] | `src/pages/PropertyDetails.jsx` |
| `/property/:id/reviews` | [[PropertyReviews-Page]] | `src/pages/PropertyReviews.jsx` |
| `/owner/:id` | [[OwnerProfile-Page]] | `src/pages/OwnerProfile.jsx` |
| `/login` | [[Login-Page]] | `src/pages/Login.jsx` |
| `/signup` | [[Signup-Page]] | `src/pages/Signup.jsx` |
| `/forgot-password` | [[ForgotPassword-Page]] | `src/pages/ForgotPassword.jsx` |
| `/favorites` | [[Favorites-Page]] | `src/pages/Favorites.jsx` |
| `/download` | [[Download-Page]] | `src/pages/Download.jsx` |
| `/about` | [[AboutUs-Page]] | `src/pages/AboutUs.jsx` |
| `/contact` | [[Contact-Page]] | `src/pages/Contact.jsx` |
| `/pricing` | [[Pricing-Page]] | `src/pages/Pricing.jsx` |
| `/sitemap` | [[Sitemap-Page]] | `src/pages/Sitemap.jsx` |
| `/privacy-policy` | [[PrivacyPage-Page]] | `src/pages/PrivacyPage.jsx` |
| `/terms` | [[Terms-Page]] | `src/pages/Terms.jsx` |
| `/blog` | [[Blog-Page]] | `src/pages/Blog.jsx` |
| `/blog/:id` | [[BlogPost-Page]] | `src/pages/BlogPost.jsx` |
| `/map` | [[MapPage-Page]] | `src/pages/MapPage.jsx` |

## Protected Routes (`ProtectedRoute` guard)

| Route | Page Note | Extra Guard |
|-------|-----------|-------------|
| `/onboarding` | [[Onboarding-Page]] | — |
| `/post-ad` | [[AddProperty-Page]] | — |
| `/profile` | [[Account-Page]] | — |
| `/settings` | [[Settings-Page]] | — |
| `/notifications` | [[Notifications-Page]] | — |
| `/edit-profile` | [[EditProfile-Page]] | — |
| `/setup-owner-profile` | [[SetupOwnerProfile-Page]] | `OnboardingGuard` |
| `/verify-email` | [[VerifyEmail-Page]] | — |
| `/change-password` | [[ChangePassword-Page]] | — |
| `/my-listings` | [[MyListings-Page]] | — |
| `/my-move-ins` | [[MyMoveIns-Page]] | — |
| `/my-bookings` | [[MyBookings-Page]] | — |
| `/my-reviews` | [[MyReviews-Page]] | — |
| `/messages` | [[Inbox-Page]] | — |
| `/messages/request/:requestId` | [[ConversationDetail-Page]] | — |
| `/messages/:conversationId` | [[ConversationDetail-Page]] | — |
| `/enquiry` | [[Enquiry-Page]] | — |
| `/report-property/:id` | [[ReportProperty-Page]] | — |
| `/referral` | [[ReferralDashboard-Page]] | — |
| `/my-payments` | [[MyPayments-Page]] | — |

## Admin Routes

| Route | Page Note |
|-------|-----------|
| `/admin/*` | [[AdminPanel-Page]] |

## Route Guards

- `ProtectedRoute` → redirects to `/login` if no `currentUser`
- `AdminRoute` → checks Firebase custom claim `role: 'admin'`
- `OnboardingGuard` → enforces onboarding completion before accessing protected setup pages

> [!note]
> `/map` route does **not** use `PageWrapper` (intentional — Leaflet needs full viewport control without transition wrapper)
