---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Terms-Page]
---

# Page: PrivacyPage

## Purpose
A static, text-heavy page displaying the platform's Privacy Policy. It informs users about data collection, usage, and sharing practices in compliance with legal standards.

## Route
`/privacy` — Publicly accessible

## What the User Can Do Here
1. Read the privacy policy.
2. See the "Last updated" date dynamically generated via JavaScript (`new Date().toLocaleDateString()`).

## Features & Functionality

### Static Content Rendering
Renders a simple layout leveraging Tailwind Typography (`prose prose-slate dark:prose-invert`) for clean, readable text formatting.

## UI Elements
- Standard header.
- Formatted text sections (Information We Collect, How We Use Information, Sharing of Information).

## Data & State
- Completely stateless. Does not interact with Firebase or contexts.

## Known Issues & What to Fix
- [ ] The "Last updated" date is dynamically generated using `new Date().toLocaleDateString()`, which means the policy always appears as if it was updated *today*. This is misleading from a legal standpoint; it should be a hardcoded static date or fetched from a CMS. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/PrivacyPage.jsx:11)
