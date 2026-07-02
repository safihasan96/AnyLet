---
tags: [page]
status: complete
last-updated: 2026-06-29
---

# Page: Sitemap

## Purpose
A simple, static directory page providing an organised overview of the platform's main routes, helping users (and search engine crawlers) navigate the site easily.

## Route
`/sitemap` — Publicly accessible (typically linked from the footer)

## What the User Can Do Here
1. View categorized lists of links to various sections of the website.
2. Click any link to navigate directly to that page.

## Features & Functionality

### Static Data Structure
Uses a hardcoded array of `sections` to generate the UI dynamically. Categories include:
- Main Pages
- For Users
- For Owners
- Company

## UI Elements
- Clean, grid-based layout.
- Simple, unstyled (mostly typography-focused) link lists inside card containers.

## Data & State
- Completely stateless. Does not interact with Firebase or contexts.

## Navigation
### Exits To
- Practically every major route in the application (`/`, `/search`, `/download`, `/login`, `/signup`, `/my-listings`, `/favorites`, `/post-ad`, `/pricing`, `/about`, `/contact`, `/privacy-policy`, `/terms`).
