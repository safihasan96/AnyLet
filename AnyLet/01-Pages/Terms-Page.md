---
tags: [page]
status: complete
last-updated: 2026-06-29
---

# Page: Terms

## Purpose
Displays the Terms and Conditions that govern the use of the Any-Let platform. Users must agree to these terms when creating an account.

## Route
`/terms` — Publicly accessible

## What the User Can Do Here
1. Read the legal terms governing their use of the platform, including Account Registration rules and User Generated Content policies.

## Features & Functionality

### Static Content Presentation
This is a purely static component rendering hardcoded text. It leverages the `@tailwindcss/typography` plugin (`prose` classes) to ensure the text is highly readable, with proper margins, line heights, and responsive sizing.

## UI Elements
- Standard typography layout (Headers, paragraphs).
- Container with rounded corners and subtle shadows to match the app's aesthetic.

## Data & State
- Completely stateless. Does not interact with Firebase or contexts.

## Navigation
### Exits To
- Back navigation is handled globally by the `MobileNavBar` on small screens or browser back history.
