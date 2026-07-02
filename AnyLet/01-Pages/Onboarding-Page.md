---
tags: [page]
status: complete
last-updated: 2026-06-29
related: [Login-Page, Signup-Page]
---

# Page: Onboarding

## Purpose
A progressive, multi-step wizard designed to capture essential user details (Personal Details and Phone Verification) immediately after they sign up but before they can fully access the platform. It updates the user's `onboardingStep` in Firestore to track their progress and supports resuming from where they left off.

## Route
`/onboarding` — Requires Auth

## What the User Can Do Here
1. **Step 1 (Personal Details):** Enter their First Name, Last Name, and Date of Birth.
2. **Step 2 (Phone Verification):** Enter their phone number. Optionally, they can choose to "Skip for now".
3. **Completion:** View a success screen with a button to "Start Exploring".
4. Navigate backward to a previous step (except from the completion screen).
5. If they abandon onboarding and return later, the wizard automatically resumes at their last incomplete step.

## Features & Functionality

### Step Management & Resumption
The user's current step is tracked via `userData.onboardingStep` (e.g. `'personal_details'`, `'phone_verification'`, `'completed'`). When the page loads, `initialStepIdx` is calculated based on the saved state, automatically skipping completed steps.

### Data Validation
- **Age Restriction:** `isAdult(dob)` ensures the user is at least 18 years old.
- **Phone Validation:** `isValidPhone(num)` uses regex to validate standard Bangladeshi numbers (`+880` or `01X`) or international numbers.

### Phone Verification Skip
The user can click "Skip for now" on the phone step. This sets `onboardingStatus: 'COMPLETED'` and `onboardingStep: 'completed'` in Firestore, allowing them into the app without a phone number.

### Framer Motion Transitions
- Utilises `<AnimatePresence mode="wait">` to animate between steps.
- The `slide` variant dynamically slides left or right depending on the `dir` state (1 for next, -1 for back).
- Animated progress bar and step pills in the sticky header.

### Compression Utility (Unused)
The file includes a `compressImage` utility for client-side image resizing, but it is not currently used within the component. (Likely a leftover from an older version that included ID/Avatar upload in onboarding).

## UI Elements
- Dynamic Progress Bar (Step 1 of X).
- Custom inputs with focus states and error handling.
- `ContinueButton` — Sub-component with loading spinner.
- `ErrorBanner` — Sub-component for inline validation errors.
- Completion Screen — Final success state with a prominent checkmark.

## Data & State
### Firestore Collections Used
- `users` — Write (via `updateUserProfile` from `AuthContext`).

### Local State
- `stepIdx` — Integer tracking the current wizard step.
- `dir` — Integer (1 or -1) tracking animation direction.
- `saving` — Boolean for button loading state.
- `error` — String for generic errors.
- `firstName`, `lastName`, `dob` — Step 1 inputs.
- `phone`, `phoneError` — Step 2 inputs.

### External Hooks
- [useAuth](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/contexts/AuthContext.jsx:1) — Provides `userData` and `updateUserProfile`.
- `useSearchParams` — Reads the `?next=` parameter to determine where to redirect upon completion.

## Navigation
### Enters From
- `ProtectedRoute` — If a user signs in but their `onboardingStatus` is not complete, they are force-redirected here.

### Exits To
- `?next=` URL (default `/`) — Upon successful completion of all steps.

## Permissions & Auth
- **Requires Auth:** Yes. Wait, the component itself doesn't explicitly redirect if `!currentUser` but the global router setup handles it.

## Known Issues & What to Fix
- [ ] The `compressImage` utility function is defined at the top of the file but never used. It should be moved to a shared utils file or removed. — [Code Link](vscode://file/Users/safihasan/Desktop/AnyLet%20Web/src/pages/Onboarding.jsx:36)
