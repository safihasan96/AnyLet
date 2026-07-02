---
title: Service — Cloudinary
type: service
tags: [services, media, images, cloudinary]
status: stable
last-scanned: 2026-06-28
related: [Feature-KYC, DM-properties]
---

# Service: Cloudinary

Handles all media assets uploaded by users (Property Images, KYC Documents, Avatars).

## Architecture
- **Client-Side Uploads**: Rather than piping large binary files through the Vercel backend (which has 4.5MB payload limits and strict timeouts), files are uploaded directly from the browser to Cloudinary's REST API via `fetch`.
- **Pre-processing**: Avatars are cropped client-side using `react-easy-crop` before upload to save bandwidth and storage.
- **Signed vs Unsigned**: Depending on security requirements, some uploads may use unsigned presets, while sensitive uploads (KYC) request a secure signature from `/api/cloudinary-sign.js` before calling the Cloudinary API.
- **Image Delivery**: The returned Cloudinary URLs are saved to Firestore documents (`properties.images`, `users.verification.idDocumentUrl`).
