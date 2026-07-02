---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [PropertyDetails-Page]
---

# Page: ReportProperty

## Purpose
Provides a dedicated interface for users to report a specific property listing for violations (e.g., fraud, spam, misleading info). Submits the report securely to Firestore for admin review.

## Route
`/report-property/:id` — Requires Auth

## What the User Can Do Here
1. View the title of the property they are reporting.
2. Select a reason for reporting from a predefined list of radio buttons.
3. Provide optional additional details in a text area (mandatory if the reason is "Other").
4. Submit the report.
5. View a success confirmation screen with a button to return to the property.

## Features & Functionality

### State Hydration & Fallback Fetch
The component attempts to hydrate `property` data from `location.state.property` (passed via the `Link` on `PropertyDetails`). If the state is missing (e.g., direct navigation), it falls back to fetching the property document via `getDoc` using the URL `:id`.

### Form Validation
- Prevents submission if no reason is selected.
- Enforces the `details` field if the reason is "Other".
- Requires the user to be authenticated (`currentUser` check); redirects to `/login` if not.

### Submission Logic
Writes a new document to the `reports` Firestore collection containing:
- Property metadata (`id`, `title`, `ownerId`).
- Reporter metadata (`uid`, `name`, `email`).
- Report data (`reason`, `details`, `status: 'pending'`).

## UI Elements
- Back button (desktop only).
- Radio button list custom-styled with Tailwind to look like selectable cards.
- Textarea for details.
- Success view using Framer Motion animations (`CheckCircle2` icon).
- Warning text regarding misuse of the reporting feature.

## Data & State
### Firestore Collections Used
- `properties` — Read (fallback fetch by `id`).
- `reports` — Write (create new report).

### Local State
- `property` — Property object (either from route state or fetched).
- `reason`, `details` — Form inputs.
- `submitting`, `submitted`, `loading` — Flow state booleans.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Validates user and extracts UID/email for the report.
- [useToast](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ToastContext.jsx:1) — Displays validation and error messages.

## Navigation
### Enters From
- `PropertyDetails` page → "Report this ad" button.

### Exits To
- `/property/:id` — Upon success or hitting the back button.
- `/login` — If attempting to submit while unauthenticated.

## Permissions & Auth
- **Requires Auth:** Yes, for submission.
- Writes to `reports` collection (Firestore rules should ideally restrict users to only creating reports).

## Known Issues & What to Fix
- [ ] No explicit check if the reporter is the owner of the property. Users could technically report their own listings.
