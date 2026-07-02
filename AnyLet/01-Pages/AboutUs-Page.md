---
tags: [page]
status: complete
last-updated: 2026-06-29
related: []
---

# Page: AboutUs

## Purpose
This page provides users with the company's mission statement, core values, and a brief history of the Any-Let platform. It serves as a trust-building mechanism for users (tenants and landlords) by outlining the platform's dedication to creating a transparent, fraud-free rental ecosystem in Bangladesh.

## Route
`/about-us` — Public (accessible without authentication)

## What the User Can Do Here
1. Read the company mission statement.
2. Read the trust policy regarding user and listing verification.
3. Review the company timeline (2023 - 2026).

## Features & Functionality

### Mission Statement
Displays a static block explaining the company's goal to create a transparent, efficient, and fraud-free digital ecosystem for renting and managing properties in Bangladesh.

### Core Values & Trust Policy
Highlights two main pillars: "Our Team" (built by engineers and real estate enthusiasts) and "Trust Policy" (strict verification for safety).

### Company Timeline
A chronological list of key milestones (The Idea in 2023, Beta Launch in 2024 connecting 1,000 tenants in Dhaka, Nationwide Expansion in 2026).

## UI Elements
- Main layout container (standard Tailwind styling)
- Feature cards with icons (Target, Users, ShieldCheck, Clock, MapPin)
- Timeline list items

## Data & State
### Firestore Collections Used
_None identified._ (Static page)

### Local State
_None identified._

### External Hooks
- [useNavigate](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AboutUs.jsx:2) — Imported but not actively used in the current render (likely a remnant or intended for a back button).

## Navigation
### Enters From
- Settings / More Menu
- Footer links

### Exits To
- Global Navigation via MobileNavBar / BottomNav

## Permissions & Auth
Public access. No auth guard or role required.

## Known Issues & What to Fix
- [ ] Unused import and hook: `useNavigate` is initialized as `const navigate = useNavigate();` but never used (the comment indicates the back button is handled by `MobileNavBar`). — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AboutUs.jsx:5)
