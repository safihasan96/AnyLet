---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [AgentProfile-Page, Search-Page]
---

# Page: Agents

## Purpose
The Agents directory page allows users to discover and browse registered real estate agents and property managers on the AnyLet platform. Users can filter agents by name and city, then navigate to an individual agent's profile page.

## Route
`/agents` — Public (accessible without authentication)

## What the User Can Do Here
1. View a grid of agent cards with name, agency, city, rating, specialization, and active listing count.
2. Type into the "Search by Name" filter input (currently non-functional — no state is wired to the input).
3. Select a city filter (Dhaka, Chittagong, Sylhet) from a dropdown (currently non-functional).
4. Click "Apply Filters" button (currently non-functional — no filtering logic exists).
5. Click an agent's name or "View Profile" button to navigate to `/agent/:id`.

## Features & Functionality

### Agent Grid (Static Mock Data)
The entire agent directory is powered by a static `MOCK_AGENTS` array defined at the top of the file (4 hardcoded agents). No Firestore query is made. This is confirmed placeholder content.

### Filter Sidebar
The sidebar renders a search input and city dropdown, but neither input has an `onChange` handler wired to state. The "Apply Filters" button has no `onClick`. The filter UI is visually complete but entirely non-functional.

### Agent Cards
Each card shows the agent's dicebear avatar, name (linked to `/agent/:id`), agency, city, rating, specialization, and active listing count. A "View Profile" link navigates to the individual agent page.

## UI Elements
- Filter Sidebar — Sticky sidebar with search and city dropdown (non-functional).
- Agent Cards Grid — 2-column grid of agent detail cards.
- Avatar — DiceBear `notionists` style SVG avatars.
- "View Profile" Link — Links to `/agent/:id`.

## Data & State
### Firestore Collections Used
_None identified._ (Page uses entirely hardcoded `MOCK_AGENTS` array.)

### Local State
_None identified._

### External Hooks
_None identified._

## Navigation
### Enters From
- Site navigation / footer / any "Find an Agent" CTA.

### Exits To
- `/agent/:id` — Via agent card name or "View Profile" button.

## Permissions & Auth
Public access. No auth guard required.

## Known Issues & What to Fix
- [ ] **CRITICAL:** The entire page uses a hardcoded `MOCK_AGENTS` array. No Firestore query is made to load real agents from the database. This page is non-functional as a real directory. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Agents.jsx:4)
- [ ] The Search by Name input has no `useState` or `onChange` handler. It renders but does nothing. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Agents.jsx:35)
- [ ] The City filter dropdown has no `onChange` or filtering logic. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Agents.jsx:42)
- [ ] The "Apply Filters" button has no `onClick` handler. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Agents.jsx:50)
