---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Contact-Page, Account-Page, AdminPanel-Page]
---

# Page: Enquiry

## Purpose
The Enquiry page is the authenticated user's support ticket system. Users can submit new support requests ("tickets") with a topic and description, track the status of their existing tickets, read admin replies, and continue conversations with the support team. It is the formal in-app help desk for AnyLet.

## Route
`/enquiries` (or similar) — Requires Auth

## What the User Can Do Here
1. View a list of all their previously submitted support tickets, sorted by most-recently-updated.
2. Click on a ticket to view its full details, admin replies, and conversation history.
3. Click the `+` button to open a new enquiry submission form.
4. Fill in a Topic and Description for a new support request.
5. Submit the new enquiry form (creates a new `enquiries` document in Firestore).
6. From a selected enquiry, click "Continue Thread" to pre-fill a new form with `Re: [topic]` for follow-up.
7. Navigate back to the previous page.

## Features & Functionality

### Real-Time Ticket List
On mount, an `onSnapshot` listener fetches all `enquiries` documents where `userId == currentUser.uid`, bounded by `QUERY_LIMITS.ENQUIRIES`. Results are sorted client-side by `updatedAt` (or `createdAt`) descending.

### New Enquiry Form
A slide-in form with Topic (text input) and Description (textarea) fields. On submit, `addDoc` creates a document in the `enquiries` collection with `type: 'ticket'` and `status: 'pending'`. Form fields are reset and the form closes on success.

### Ticket Detail View
Clicking a ticket from the list opens a detailed view showing the original description, the ticket status badge (Pending/Resolved), and any admin replies in a conversation thread format. From here the user can continue the thread.

### Thread Continuation
The "Continue Thread" action populates the new form with `Re: [original topic]` as the subject, creating a new linked enquiry document (not an actual reply on the same document — each submission is a new document).

### Loading & Error States
Uses the `Skeleton` component for initial loading. Displays an error message if the Firestore query fails (e.g., due to a missing composite index).

## UI Elements
- `Skeleton` — [Skeleton.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/Skeleton.jsx:1) — Loading state.
- Ticket List — Scrollable cards showing topic, status badge, and timestamp.
- New Enquiry Form — Slide-in form panel with Topic and Description fields.
- Ticket Detail View — Expanded view with conversation thread.
- Status badges: Pending (amber), Resolved (emerald).

## Data & State
### Firestore Collections Used
- `enquiries` — Read (real-time via `onSnapshot`, filtered by `userId`) / Write (new ticket via `addDoc`).

### Local State
- `enquiries` — Array of the user's ticket documents.
- `loading` — Boolean for initial skeleton state.
- `error` — String for Firestore error display.
- `showForm` — Boolean controlling form visibility.
- `selectedEnquiry` — Object for the currently expanded ticket detail.
- `topic`, `description` — Controlled form input strings.
- `submitting` — Boolean for form submit loading state.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser`.

## Navigation
### Enters From
- Account / Settings → "Support & Tickets" link.

### Exits To
- Previous page — via back button.

## Permissions & Auth
- **Requires Auth:** Yes. The query filters by `currentUser.uid`.

## Known Issues & What to Fix
- [ ] The `onSnapshot` query for `enquiries` does not include `orderBy('createdAt', 'desc')` in the Firestore query itself (it sorts client-side). This means it may require a composite index if `orderBy` is added later, and performance degrades at scale. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Enquiry.jsx:38)
- [ ] "Continue Thread" creates a brand new `enquiries` document rather than appending a reply to the existing one. This is inconsistent with the `AdminPanel` which threads replies within a single document using the `replies[]` array. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Enquiry.jsx:98)
