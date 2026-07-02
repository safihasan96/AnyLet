---
title: DM — KYC Submissions
type: data-model
tags: [data-models, firestore, kycSubmissions, identity]
status: stable
last-scanned: 2026-06-28
related: [Feature-KYC, Arch-Auth-and-Security]
---

# `kycSubmissions` Collection

Tracks identity verification documents submitted by users for admin approval.

## Fields (Inferred)
- `uid` (string) — Submitting user's UID
- `documentType` (string) — e.g. `NID`, `Passport`
- `documentUrl` (string) — Cloudinary image URL
- `status` (string) — `pending`, `approved`, `rejected`
- `submittedAt` (timestamp)
- `reviewedAt` (timestamp)
- `reviewedBy` (string) — Admin UID
- `rejectionReason` (string) — Optional text if rejected

## Flow
- User submits via `KYCVerification.jsx` → creates/updates document.
- Admin reviews via `/api/admin-review-kyc.js`.
- Upon approval, the linked `users` document is updated (`verification.isKycApproved = true`).
