# 🏠 Anylet — Master Map of Content (MOC)
> *Principal Architecture Reference — rendered for Obsidian. All links are double-bracket cross-references.*
> **Version:** 1.0.1 · **Stack:** React 19 + Vite 7 + Firebase 12 + Tailwind 4 + Capacitor 8

---

## 📁 Vault Index

| Document | Purpose |
|---|---|
| [[_Anylet_Docs/Backend/Database_and_Auth_Architecture]] | Firestore schema, email-based admin auth flows, JWT claims |
| [[_Anylet_Docs/Frontend/UI_and_Design_System]] | Tailwind v4 token system, component hierarchy, layout patterns |
| [[_Anylet_Docs/Integrations/Media_Pipeline]] | Cloudinary signed-upload flow, payload signatures |
| [[_Anylet_Docs/Decisions/ADR-001-Firebase-over-custom-backend]] | Why Firebase was chosen as the primary persistence layer |
| [[_Anylet_Docs/Decisions/ADR-002-Mobile-Money-over-Stripe]] | Why bKash/Nagad/Rocket SMS-webhook was chosen over card payments |
| [[_Anylet_Docs/Decisions/ADR-003-Tailwind-v4-and-Vite-CSS]] | Why Tailwind v4 Vite plugin was chosen over PostCSS pipeline |

---

## 🗂️ Workspace Root

- **Frontend Entry Points:**
  - [[src/main.jsx]] — React DOM mount, global providers.
  - [[src/App.jsx]] — Router definition, route guards (`ProtectedRoute`, `AdminRoute`), and lazy loading.
- **Component Directories:**
  - [[src/components/layout]] — High-level layout shells (e.g., [[src/components/layout/Header.jsx]]).
  - [[src/components/ui]] — Reusable atoms (buttons, modals).
  - [[src/components/listings]] — Specific to rental logic (e.g., [[src/components/listings/PropertyCard.jsx]]).
- **Tailwind Configuration:**
  - [[src/index.css]] — Tailwind v4 `@theme` block containing all global tokens (no `tailwind.config.js`).
- **Firebase Initialization:**
  - [[src/firebase.js]] (Inferred client init)
  - [[api/_lib/firebase-admin.js]] (Server-side admin init)
- **Third-Party Integrations:**
  - [[api/cloudinary-sign.js]] — Media signature generation.
  - [[api/sms-webhook.js]] — Mobile money payment reconciliation.

---

## 🧩 Key System Blocks

### Authentication & Routing Guard
- **[[src/contexts/AuthContext.jsx]]** — Manages session state and links Google OAuth to email/password.
- **[[src/components/AdminRoute.jsx]]** — Validates JWT claims for admin routes.

### Marketplace UI Hierarchy
- **[[src/pages/Home.jsx]]** → Renders lists of **[[src/components/PropertyCard.jsx]]**.
- **[[src/pages/PropertyDetails.jsx]]** → Deep dive into listing, triggers **[[src/components/BookPropertyModal.jsx]]**.
- **[[src/pages/Search.jsx]]** → Client-side filter engine mapping to Firestore queries.

### Vercel Serverless Backend (`api/`)
- **[[api/create-payment-intent.js]]** — Instantiates escrow ledgers.
- **[[api/admin-review-kyc.js]]** — Admin approval pipeline for user identity.