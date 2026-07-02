---
title: Feature — KYC Verification
type: feature
tags: [features, kyc, identity]
status: stable
last-scanned: 2026-06-28
related: [DM-kycSubmissions, Service-Cloudinary]
---

# Feature: KYC Identity Verification

Mandatory document verification flow for owners, and optional/recommended for tenants.

## Files Involved
- `src/components/KYCVerification.jsx`
- `src/pages/Account.jsx`
- `api/admin-review-kyc.js`
- `api/verify-kyc.js`

## Collections Touched
- `kycSubmissions`
- `users` (updates `verification.isKycApproved`)

## Flow
1. User clicks "Verify Identity" in their dashboard.
2. `KYCVerification.jsx` modal opens.
3. User uploads front/back of NID or Passport. Images are directly uploaded to Cloudinary (using unsigned presets or signed via `/api/cloudinary-sign.js`).
4. Document written to `kycSubmissions` with status `pending`.
5. User's `onboardingStatus` becomes `PENDING_VERIFICATION`.
6. Admin reviews via Admin Panel.
7. Upon admin approval via `/api/admin-review-kyc.js`, the user's profile is marked verified.

## Legacy Note
> [!note]
> `Account.jsx` contains a legacy inline KYC modal that is currently `{false && showKycModal && ...}` commented out. The active implementation uses the imported `KYCVerification` component.
