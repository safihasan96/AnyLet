---
title: Arch — Tech Stack
type: architecture
tags: [architecture, tech-stack]
status: stable
last-scanned: 2026-06-28
related: [Arch-Build-and-Deploy]
---

# Tech Stack

Verified strictly against `package.json`.

## Core Framework
- **React**: v19.2 (Using the latest React 19 stable)
- **Routing**: React Router DOM v7.13
- **Bundler**: Vite v7.3

## Styling & Animation
- **Tailwind CSS**: v4 (via `@tailwindcss/vite`). All variables exist in `src/index.css`.
- **Framer Motion**: v12.38 for complex transitions and gestures.
- **Icons**: Lucide React v0.575.

## Backend / Platform
- **Firebase Client SDK**: v12.15 (Auth, Firestore)
- **Firebase Admin SDK**: v14.0 (Server-side API functions)
- **API Functions**: Vercel Serverless Functions (`/api/*`)

## Maps & Geospatial
- **Leaflet**: v1.9.4
- **React-Leaflet**: v5.0.0
- **React-Leaflet-Cluster**: v4.1.3

## Mobile Packaging
- **Capacitor**: v8.2.0 (Core, iOS, Android, Status Bar)

## Utility / Services
- **React Helmet Async**: v3.0 (SEO/Metadata)
- **React Easy Crop**: v5.5 (Image cropping)
- **Cloudinary**: Client-side fetch + Node SDK for signatures
- **EmailJS**: v4.4.1 (Browser-side emails)
