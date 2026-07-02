---
title: Feature — Auth & Onboarding
type: feature
tags: [features, auth, onboarding]
status: stable
last-scanned: 2026-06-28
related: [DM-users, Arch-Auth-and-Security, Service-Firebase]
---

# Feature: Auth & Onboarding

Handles user registration, login, auto account-linking (Google + Password), and the mandatory onboarding wizard.

## Files Involved
- `src/contexts/AuthContext.jsx`
- `src/pages/Login.jsx`, `Signup.jsx`, `ForgotPassword.jsx`, `VerifyEmail.jsx`
- `src/pages/Onboarding.jsx`, `SetupOwnerProfile.jsx`
- `src/components/OnboardingGuard.jsx`, `ProtectedRoute.jsx`

## Collections Touched
- `users` (Reads/Writes)

## User Flow

```mermaid
flowchart TD
    A[Start] --> B{Login / Signup}
    B -->|Google| C[signInWithPopup]
    B -->|Email/Pass| D[signInWithEmailAndPassword]
    
    C --> E{Account exists?}
    E -->|Yes, Password only| F[Prompt to link accounts]
    E -->|No| G[Create user doc]
    
    D --> H[Check Email Verified]
    H -->|No| I[Block & send verification email]
    H -->|Yes| J[Proceed to App]
    G --> J
    F -->|Password entered| J
    
    J --> K{Onboarding Complete?}
    K -->|No| L[Redirect to /onboarding]
    K -->|Yes| M[Redirect to target page]
```

## Edge Cases Handled in Code
- **Google Linking**: If a user creates an account with email/password, then later clicks "Continue with Google", Firebase throws `auth/account-exists-with-different-credential`. The app catches this, enters a `linkPending` state in `Login.jsx`, prompts for their password, and links the Google credential to the existing account seamlessly.
- **Email Verification**: Blocked at login if `user.emailVerified` is false.
