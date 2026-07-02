---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Enquiry-Page]
---

# Page: Contact

## Purpose
Provides users with multiple ways to reach AnyLet support: office address, phone number, and email. Also includes a contact form for users to send a message directly. This is the platform's primary public-facing support touchpoint.

## Route
`/contact` — Public (accessible without authentication)

## What the User Can Do Here
1. View the company's office address (Gulshan 1, Dhaka 1212).
2. View the support phone number and operating hours (10 AM - 6 PM).
3. View the support email address (`support@anylet.com.bd`).
4. Click the back arrow to return to the previous page.
5. Fill in the contact form (Name, Email, Message) and submit it.

## Features & Functionality

### Contact Information Cards
Three visually distinct info cards display: office address (MapPin icon), phone number with operating hours badge (Phone icon), and email address (Mail icon).

### Contact Form
A three-field form (Name, Email, Message) with basic `required` HTML validation. On submit, `e.preventDefault()` is called and `toast.success('Message sent!')` is fired — but **no actual backend call is made**. The form data is not sent anywhere.

### Back Navigation
A back button calls `navigate(-1)` to return to the previous page in history.

## UI Elements
- Three contact info cards with icon, title, and detail.
- Contact form with Name, Email, and Message fields.
- Submit button with Send icon.
- Back arrow navigation button.

## Data & State
### Firestore Collections Used
_None identified._ (The form submission is a no-op toast — nothing is written to Firestore.)

### Local State
_None identified._

### External Hooks
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1) — Fires a success toast on form submit.
- [useNavigate](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Contact.jsx:2) — Used for the back button.

## Navigation
### Enters From
- Settings / More menu.
- Footer links.
- Any "Contact Us" CTA in the app.

### Exits To
- Previous page — via the back button.

## Permissions & Auth
Public access. No auth guard required.

## Known Issues & What to Fix
- [ ] **CRITICAL:** The contact form does not submit data anywhere. No `addDoc` to Firestore's `enquiries` collection, no email service, no backend call. It only fires a success toast. Real form submission must be implemented. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Contact.jsx:52)
- [ ] Phone number and email are hardcoded placeholder values (`+880 1700-000000`, `support@anylet.com.bd`). These should be replaced with real contact details or loaded from a config. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Contact.jsx:38)
