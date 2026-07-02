---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [BlogPost-Page]
---

# Page: Blog

## Purpose
The Blog page serves as the content marketing hub for AnyLet, publishing guides, legal advice, area reviews, and market trend articles relevant to the Bangladesh property rental market. It helps attract organic traffic and establish trust with users researching their next move.

## Route
`/blog` — Public (accessible without authentication)

## What the User Can Do Here
1. View a grid of blog post preview cards.
2. Click a category filter tab (All, Market Trends, Area Guides, Legal, Tips) — visually functional but not connected to filtering logic.
3. Navigate to a full blog post by clicking a post card.

## Features & Functionality

### Blog Post Grid (Static Mock Data)
All 3 visible blog posts are driven by a hardcoded `MOCK_POSTS` array. No Firestore query is made. Content includes hardcoded titles, excerpts, authors, dates, read times, and Unsplash image URLs.

### Category Filter Tabs
A horizontally scrollable row of category pill buttons renders above the grid. The "All" button is visually styled as active (filled). Clicking other categories has no `onClick` handler — the filter does nothing.

### Post Cards
Each card shows a cover image with a category badge overlay, post title, excerpt (2-line clamped), author, date, and read time. The entire card is a `<Link>` to `/blog/:id`.

## UI Elements
- Category Filter Tabs — Horizontally scrollable pill buttons.
- Post Cards — 3-column grid (responsive).
- Cover images from Unsplash (hardcoded URLs).

## Data & State
### Firestore Collections Used
_None identified._ (Entirely static mock data)

### Local State
_None identified._

### External Hooks
_None identified._

## Navigation
### Enters From
- Site footer or navigation menu.

### Exits To
- `/blog/:id` — Via blog post card click.

## Permissions & Auth
Public access. No auth guard required.

## Known Issues & What to Fix
- [ ] **CRITICAL:** All blog posts are hardcoded mock data. A real CMS integration (Firestore, Sanity, or similar) is needed to make this page functional. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Blog.jsx:4)
- [ ] Category filter tabs have no `onClick` handler or state management. Clicking any tab does nothing. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Blog.jsx:48)
