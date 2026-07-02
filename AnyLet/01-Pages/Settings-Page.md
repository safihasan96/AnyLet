---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Account-Page]
---

# Page: Settings

## Purpose
A global configuration page where users can adjust app preferences (Theme, Language, Notifications) and perform critical account actions like logging out.

## Route
`/settings` — Requires Auth (implied, accessed via Account tab)

## What the User Can Do Here
1. Toggle the application theme between Light and Dark mode.
2. Change the application language (English / Bengali).
3. Toggle local notification preferences.
4. Sign out of their account.

## Features & Functionality

### Global State Toggles
Uses custom context hooks to instantly apply UI changes across the entire React tree without page reloads.
- `useTheme` for `isDark` / `toggleTheme`.
- `useLanguage` for `language` / `setLanguage` and the `t()` translation function.

### Authentication Logout
Invokes Firebase `signOut(auth)`. Upon success, the user is redirected to the `/login` route.

## UI Elements
- Custom toggle switches (Animated pill buttons mapping to boolean states).
- Native `<select>` element for language picking (styled to blend in).
- "Sign Out" button styled with destructive red colours to indicate a state-changing action.

## Data & State
### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1)
- [useTheme](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/ThemeContext.jsx:1)
- [useLanguage](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/LanguageContext.jsx:1)

### Local State
- `notificationsEnabled` — Boolean (Currently only local UI state; does not persist to backend).

## Navigation
### Exits To
- `/login` — Upon successful sign out.

## Known Issues & What to Fix
- [ ] The `notificationsEnabled` toggle only updates local component state and resets on unmount. It needs to be hooked up to `updateDoc` on the user's Firestore profile or persisted in `localStorage` to actually control notification flow. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Settings.jsx:16)
