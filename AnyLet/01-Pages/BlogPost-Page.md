---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Blog-Page]
---

# Page: BlogPost

## Purpose
Renders the full content of an individual blog post, providing users with in-depth reading material on rental tips, area guides, or legal advice. Provides a rich reading experience with typography-focused layout, author info, and a share button.

## Route
`/blog/:id` — Public (accessible without authentication)

## What the User Can Do Here
1. Read the full article content.
2. View the author name, publish date, and estimated read time.
3. Click the back arrow button (desktop only) to navigate to the previous page.
4. Click "Share" — currently a visual button with no `onClick` handler.

## Features & Functionality

### Static Content Only
The entire article is hardcoded. The `id` URL parameter is read via `useParams()` and displayed inline in the title (e.g., "Top 10 Areas to Rent in Dhaka for Families (1)"), confirming the routing works, but **no actual data lookup by ID is performed**. All content is the same article regardless of which ID is in the URL.

### Hero Image
A hardcoded Unsplash image is used as the full-width hero image. A gradient overlay darkens the lower portion for contrast with the card that overlaps it.

### Back Navigation
A back button (`ArrowLeft` icon) is rendered **only on desktop** (`hidden md:block`). It calls `navigate(-1)` to go back in browser history.

### Share Button
The "Share" button is visually present but has no `onClick` handler. No Web Share API or copy-to-clipboard logic is implemented.

### Prose Content
The article body uses Tailwind's `prose` typography plugin classes for nice reading defaults. The content covers Gulshan, Dhanmondi, and Bashundhara Residential Area.

## UI Elements
- Full-width hero cover image with gradient.
- Article card with `prose` typography.
- Author avatar (icon placeholder).
- Metadata row: date, read time, share button.

## Data & State
### Firestore Collections Used
_None identified._ (Static hardcoded content)

### Local State
_None identified._

### External Hooks
- [useParams](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/BlogPost.jsx:2) — Reads `:id` from the URL but only to embed it in the hardcoded title.
- [useNavigate](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/BlogPost.jsx:2) — Used for the back button.

## Navigation
### Enters From
- Blog page → clicking a post card.

### Exits To
- Previous page — via the back button (`navigate(-1)`).

## Permissions & Auth
Public access. No auth guard required.

## Known Issues & What to Fix
- [ ] **CRITICAL:** The page renders identical hardcoded content for every `id`. Dynamic content lookup by `id` is not implemented. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/BlogPost.jsx:5)
- [ ] The "Share" button has no `onClick` handler; the Web Share API or clipboard copy should be implemented. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/BlogPost.jsx:46)
- [ ] The back button is `hidden md:block` — mobile users have no in-page navigation to go back. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/BlogPost.jsx:18)
