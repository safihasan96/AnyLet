---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Account-Page, MyListings-Page, Pricing-Page]
---

# Page: AddProperty

## Purpose
This page allows authenticated property owners to create a new property listing and submit it for admin review. It implements a 3-step wizard that collects all property information, processes the listing fee payment via bKash/Nagad/Rocket, and creates the property document in Firestore. Listings are created in a pending `isApproved: false` state and go live only after admin approval.

## Route
`/add-property` — Requires Auth + requires verified phone number

## What the User Can Do Here
1. Fill in the property title, type, and tenant preference (Family, Bachelor Male/Female, Any).
2. Select the location via cascading dropdowns: Division → District → Upazila/Thana.
3. Enter rent, area (sq ft), beds, baths, verandas, security deposit, and utilities cost.
4. Set the billing cycle (Month / Week / Day).
5. Select included utilities (Gas, Electricity, Water, WiFi, etc.) from a tag-picker.
6. Select available features (Lift, CCTV, Balcony, Parking, etc.) from a tag-picker.
7. Upload up to 5 property photos (secure signed Cloudinary upload).
8. Remove any uploaded photo individually.
9. Toggle "Instant Booking" to allow direct bookings without manual acceptance.
10. Provide Bangladesh-specific details: gas supply type, electricity billing, water source, floor number, facing, parking type.
11. Enter distances to nearby landmarks (mosque, school, market).
12. Optionally request on-site verification by AnyLet staff (extra fee: ৳299).
13. Proceed to payment to pay the listing fee (৳49 for free users, ৳0 for active subscribers).
14. Submit bKash/Nagad/Rocket transaction ID in a payment modal.
15. View a success screen confirming submission and auto-redirect to Home.

## Features & Functionality

### Pre-entry Guard: Phone Number Check
On mount, a `useEffect` checks if the user's profile has a phone number. If not, a modal (`showPhoneModal`) blocks the page and forces the user to navigate to Edit Profile to add one.

### Subscription-Aware Pricing
The listing fee is dynamically calculated: if the user has an active `subscriptionPlan` (non-expired), the listing fee is ৳0 (free). Otherwise it is ৳49. The optional on-site verification costs ৳299. Total is computed as `LISTING_FEE + (wantOnsiteVerify ? ONSITE_FEE : 0)`.

### 3-Step Wizard
- **Step 1 — Core Details:** Property title, type, tenant type, location, rent, beds, baths, area, description, utilities, features, and photos.
- **Step 2 — BD-Specific Details:** Gas supply, electricity billing, water source, facing, floor number, parking, pet policy, bachelor policy, family policy, distances to landmarks.
- **Step 3 — Preview & Publish:** A read-only summary of all entered data. User confirms, selects on-site verification option, and proceeds to payment.

### Secure Multi-Photo Upload
Fetches one Cloudinary signature from `/api/cloudinary-sign` (authenticated via Firebase ID token), then iterates over selected files and uploads each one with a 30-second abort timeout. Stores up to 5 URLs in the `images` array. Also maintains `imageUrl` and `image_url` for backward compatibility.

### Payment Modal & Listing Submission
On payment modal confirmation, the `handlePaymentSubmitted` function is called with a `paymentDocId`. It sanitizes the title and description using `DOMPurify`, constructs the full property document, and calls `addDoc(collection(db, 'properties'), propertyData)`. The property is marked `isApproved: false` and `status: 'Available'`. A notification is sent to the user via `createNotification`.

### Post-Submission Success Screen
An `AnimatePresence` overlay appears on successful submission, informing the user that their listing is under review (usually <30 minutes), then auto-navigates to Home after 4 seconds.

## UI Elements
- `Section` — Local reusable wrapper component with a title and icon.
- `Input` — Local labeled input component.
- `Textarea` — Local labeled textarea component.
- `Select` — Local labeled select component.
- `PreviewInfo` — Read-only label/value display for the preview step.
- `PaymentModal` — Component rendered via `createPortal` for bKash/Nagad/Rocket payment input.
- Success Overlay — Full-screen `motion.div` confirmation screen.
- Phone Number Required Modal — Blocking `createPortal` modal if phone is missing.

## Data & State
### Firestore Collections Used
- `properties` — Write (creates a new document with `addDoc` on successful payment submission).
- `notifications` — Write (via `createNotification` utility after submission).

### Local State
- `step` — Integer (1–3), controls which wizard step is displayed.
- `formData` — Full property form object (title, type, location, rent, beds, baths, images, BD-specific fields, etc.).
- `loading` — Boolean for image upload and form submission spinners.
- `showSuccess` — Boolean for the post-submission success overlay.
- `paymentModalOpen` — Boolean for the payment modal.
- `publishConfirmOpen` — Boolean for the publish confirmation step.
- `showPhoneModal` — Boolean for the blocking phone-required modal.
- `wantOnsiteVerify` — Boolean, whether user opted for on-site verification.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `currentUser` and `userProfile` (for subscription check).
- [useNavigate](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AddProperty.jsx:4) — Navigation after success or phone guard.

## Navigation
### Enters From
- Home page "Post Property" CTA button.
- Account page "Add Listing" link.

### Exits To
- `/` — On successful submission (auto-redirect after 4 seconds).
- `/edit-profile` — If phone number is missing.
- Previous page — Via back button on Step 1.

## Permissions & Auth
- **Requires Auth:** ProtectedRoute wrapper required.
- **Requires Phone:** Blocked by phone-required modal if `userProfile.phone` is empty.
- **KYC not required** to post a listing, but listing goes live only after admin approval.

## Known Issues & What to Fix
- [ ] `imageUrl` and `image_url` are maintained as duplicates of `images[0]` for "backward compatibility" — a future migration should consolidate to use only the `images[]` array. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AddProperty.jsx:254)
- [ ] `agentCommission` field is in `formData` but no UI input for it exists in the form (never surfaced to the user). — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/AddProperty.jsx:111)
