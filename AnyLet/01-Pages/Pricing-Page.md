---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [PaymentModal-Component]
---

# Page: Pricing

## Purpose
Displays the platform's pricing plans for property owners, specifically showcasing the "Free" and "Premium" tiers. Allows users to initiate a subscription upgrade for enhanced visibility and features.

## Route
`/pricing` (implied) — Publicly accessible, but upgrading requires Auth context downstream.

## What the User Can Do Here
1. View the features and limits of the "Free" plan (Basic).
2. View the premium features and cost (৳999/mo) of the "Premium" plan.
3. Click "Upgrade with bKash" on the Premium plan.
4. Completing the above opens the `PaymentModal` to process the subscription payment.

## Features & Functionality

### Tiered Presentation
Uses a clean two-card layout (Free vs. Premium). The Premium card uses the primary brand colour, a "Most Popular" badge, and slightly elevates itself visually to encourage conversion.

### Payment Modal Integration
Clicking the upgrade button sets the `selectedPlan` state and opens the `PaymentModal` configured for a `'subscription'` type.

## UI Elements
- Pricing Cards (Free, Premium).
- Feature lists with checkmarks.
- Upgrade Call-to-Action button.
- `PaymentModal` — [PaymentModal.jsx](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/components/PaymentModal.jsx:1)

## Data & State
### Local State
- `paymentModalOpen` — Boolean controlling the modal visibility.
- `selectedPlan` — Object storing `{ name, amount }` for the chosen plan.

## Navigation
### Exits To
- Triggering the payment modal keeps the user on the page until payment completes (where the modal handles downstream routing or state updates).

## Known Issues & What to Fix
- [ ] The "Agency / Corporate" plan is commented out in the JSX. If this feature is active in the business logic, it should be restored. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Pricing.jsx:71)
