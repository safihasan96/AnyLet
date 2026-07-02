---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Account-Page, Search-Page]
---

# Page: Download

## Purpose
A dedicated landing page promoting and guiding users to install AnyLet as a Progressive Web App (PWA) on their Android or iOS devices. Leverages the browser's native PWA install prompt on Android and provides step-by-step Safari instructions for iOS.

## Route
`/download` — Public (accessible without authentication)

## What the User Can Do Here
1. On Android Chrome with a deferred install prompt available: click "Install App Now" to trigger the native browser install dialog.
2. View step-by-step installation instructions for Android (Open in Chrome → Tap Banner → Confirm Install).
3. View step-by-step installation instructions for iOS/Safari (Open in Safari → Tap Share → Add to Home Screen).
4. Switch between the Android and iOS instruction tabs.
5. View the app's PWA URL (`any-let.indevs.in`).
6. See an "App Installed Successfully!" confirmation after installation.

## Features & Functionality

### PWA Install Prompt (Android)
Uses the standard `beforeinstallprompt` browser event to capture the deferred install prompt. The "Install App Now" button is only rendered if the `deferredPrompt` is available (i.e., the browser has determined the PWA is installable). On click, `deferredPrompt.prompt()` is called and the user's choice is awaited. If accepted, the `installed` state is set to `true` and a success badge is shown.

### `appinstalled` Event Listener
Also listens for the `appinstalled` window event to show the success state if the install was triggered from outside the button (e.g. browser address bar prompt).

### Step-by-Step Tab Guide
Two static instruction sets (`STEPS_ANDROID`, `STEPS_IOS`) are displayed in a tabbed card. The active tab is controlled by `activeTab` state.

### Feature Highlights
Three small stat cards (Free, Fast, Offline) summarize PWA benefits.

## UI Elements
- PWA app icon (Smartphone icon placeholder).
- "Install App Now" native prompt button (conditional, Android only).
- Success badge (`CheckCircle`).
- Android / iOS tab switcher.
- Numbered step cards with icons.
- URL display footer card.

## Data & State
### Firestore Collections Used
_None identified._ (Entirely frontend/browser API page)

### Local State
- `deferredPrompt` — The captured `beforeinstallprompt` event object.
- `installed` — Boolean for post-install success state.
- `activeTab` — String (`'android'`/`'ios'`), controls which instruction set is shown.

### External Hooks
_None identified._

## Navigation
### Enters From
- Settings / More menu "Get the App" link.
- Promotional banner or navigation links.

### Exits To
_None identified._ (Self-contained page)

## Permissions & Auth
Public access. No auth guard required.

## Known Issues & What to Fix
- [ ] The PWA URL shown (`any-let.indevs.in`) appears to be a development/staging URL. This should be updated to the production domain before launch. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Download.jsx:162)
