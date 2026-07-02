---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Agents-Page, Search-Page]
---

# Page: AgentProfile

## Purpose
This page displays the public-facing profile of a single registered real estate agent. It is intended to let prospective tenants and property seekers review an agent's credentials, specialization, ratings, and active property listings before deciding to contact them.

## Route
`/agent/:id` — Public (accessible without authentication)

## What the User Can Do Here
1. View the agent's name, agency name, city, and star rating.
2. Read the agent's "About Me" bio.
3. View the agent's key stats: Active Listings count, Reviews count, and Member Since year.
4. Click "WhatsApp" to contact the agent via WhatsApp (currently a non-functional button — no `href` wired up).
5. Click "Call Agent" to call the agent (currently a non-functional button — no phone number wired up).
6. Navigate to `/search` via a "View All" link in the Active Properties section.

## Features & Functionality

### Agent Data (Static Mock)
The entire agent profile is driven by a **hardcoded mock object** local to the component. The `id` from `useParams()` is read but used only to populate `agent.id` within the static object — no Firestore query is made. All names, ratings, and stats are placeholder data.

### Active Properties Section
The Active Properties section displays a dashed empty state placeholder with the text "Property cards will render here dynamically." — no property data is fetched or rendered.

### Contact CTA Buttons
Two buttons exist (WhatsApp and Call Agent). Neither has a real phone number or `href` wired up. They are visually complete but functionally inert.

## UI Elements
- Cover photo header (primary colour with texture overlay).
- Agent avatar with verification badge (`ShieldCheck`).
- Stats grid (Listings, Reviews, Member Since).
- WhatsApp and Call Agent CTA buttons.
- "About Me" section card.
- "Active Properties" section with empty state placeholder.

## Data & State
### Firestore Collections Used
_None identified._ (Page uses entirely hardcoded mock data.)

### Local State
_None identified._

### External Hooks
- [useParams](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AgentProfile.jsx:2) — Reads the `:id` URL parameter, but it is not used to fetch real data.

## Navigation
### Enters From
- Agents page → "View Profile" link per agent card.

### Exits To
- `/search` — Via "View All" link in the Active Properties section.

## Permissions & Auth
Public access. No auth guard required.

## Known Issues & What to Fix
- [ ] **CRITICAL:** The entire page uses hardcoded mock data. No Firestore query is made to fetch the actual agent by `id`. This page is non-functional as a real feature. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AgentProfile.jsx:8)
- [ ] WhatsApp and Call Agent buttons have no functional `href` or `onClick` logic tied to real phone numbers. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AgentProfile.jsx:64)
- [ ] The "Active Properties" section is a placeholder and renders no real listings for the agent. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AgentProfile.jsx:87)
