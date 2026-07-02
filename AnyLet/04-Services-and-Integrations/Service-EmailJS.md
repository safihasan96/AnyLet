---
title: Service — EmailJS
type: service
tags: [services, email]
status: stable
last-scanned: 2026-06-28
related: [Feature-Property-Detail]
---

# Service: EmailJS

Handles sending outbound emails directly from the React client.

## Usage
- primarily used for Contact Forms or Support Enquiries where triggering a dedicated backend mailer isn't strictly necessary.
- Initialized with public keys on the client-side (`src/utils/emailService.js` if abstracted, or used directly in components like `Contact.jsx`).
- Template IDs and Service IDs map back to the AnyLet EmailJS dashboard where the actual content/routing is configured.
