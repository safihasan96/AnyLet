---
title: DM — Users
type: data-model
tags: [data-models, firestore, users]
status: stable
last-scanned: 2026-06-28
related: [Arch-Auth-and-Security, Feature-Auth]
---

# `users` Collection

Core profile and configuration store for all platform users (both tenants and owners).

## Fields (Inferred)
- `uid` (string) — matches document ID
- `email` (string)
- `role` (string) — system role (e.g., `user`, `admin`)
- `userRole` (string) — UI preference (`tenant`, `owner`)
- `accountStatus` (string) — e.g., `active`
- `emailVerified` (boolean)
- `createdAt` (timestamp)
- `referralCode` (string) — generated at signup
- `referralWallet` (map)
  - `available` (number)
  - `withdrawn` (number)
- `onboardingStep` (string) — current wizard step (e.g., `personal_details`, `completed`)
- `onboardingStatus` (string) — e.g., `IN_PROGRESS`, `PENDING_VERIFICATION`
- `personalDetails` (map)
  - `firstName` (string)
  - `lastName` (string)
  - `dateOfBirth` (string)
  - `phoneNumber` (string)
  - `isPhoneVerified` (boolean)
- `verification` (map)
  - `idDocumentUrl` (string)
  - `isKycApproved` (boolean)
  - `submittedAt` (timestamp)
- `providers` (array of strings) — e.g., `['password', 'google']`
- `referredBy` (string) — UID of referrer (if applicable)
- `refereeIds` (array of strings) — UIDs of users referred

## Relationships
- **1:1** with Firebase Auth records.
- **1:N** with `properties`, `conversations`, `kycSubmissions`.
- **Self-referential**: `referredBy` points to another `users` document.
