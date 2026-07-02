---
title: Service — Capacitor
type: service
tags: [services, mobile, capacitor, android, ios]
status: stable
last-scanned: 2026-06-28
related: [Arch-Build-and-Deploy]
---

# Service: Capacitor

Native mobile wrapper used to compile the React SPA into installable Android (`.apk`/`.aab`) and iOS (`.ipa`) applications.

## Integration
- Configured in `capacitor.config.json`.
- Points `webDir` to the Vite `dist` output folder.
- Run via NPM scripts in `package.json` (`cap:sync`, `cap:android`, `cap:ios`).

## Plugins In Use
- `@capacitor/core`
- `@capacitor/android`
- `@capacitor/ios`
- `@capacitor/status-bar` — Explicitly managing the native mobile status bar color to match the AnyLet theme (dark vs light mode).
