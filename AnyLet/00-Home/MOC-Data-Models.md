---
title: MOC — Data Models
type: architecture
tags: [moc, data-models, firestore]
status: stable
last-scanned: 2026-06-28
related: [Home]
---

# MOC — Data Models (Firestore Collections)

17 collections identified via grep across `src/` and `api/`.

| Collection | Note | Description |
|------------|------|-------------|
| `users` | [[DM-users]] | User profiles, onboarding, referral wallet |
| `properties` | [[DM-properties]] | Rental listings |
| `viewing_requests` | [[DM-viewing-requests]] | Tenant enquiry/viewing requests |
| `conversations` | [[DM-conversations]] | Messaging threads |
| `paymentIntents` | [[DM-paymentIntents]] | Escrow deposit intents |
| `payments` | [[DM-payments]] | Completed payment records |
| `escrowDeposits` | [[DM-escrowDeposits]] | Escrow tracking |
| `moveIns` | [[DM-moveIns]] | Active tenancy records |
| `tenantMoveIns` | [[DM-tenantMoveIns]] | Tenant-side move-in view |
| `kycSubmissions` | [[DM-kycSubmissions]] | KYC document submissions |
| `notifications` | [[DM-notifications]] | In-app notification feed |
| `propertyReviews` | [[DM-propertyReviews]] | Tenant reviews of properties |
| `ownerReviews` | [[DM-ownerReviews]] | Tenant reviews of owners |
| `commissions` | [[DM-commissions]] | Referral commission records |
| `enquiries` | [[DM-enquiries]] | Enquiry / contact thread |
| `reports` | [[DM-reports]] | Property abuse reports |
| `requests` | [[DM-requests]] | (Alias/legacy — verify) |

> [!caution] Inferred — verify
> `tenantMoveIns` and `moveIns` appear to track similar data. Relationship between them is not fully documented in source code. May be denormalized copies.

> [!caution] Inferred — verify
> `requests` collection may be a legacy alias for `viewing_requests`. Needs cross-reference with security rules.
