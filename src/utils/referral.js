/**
 * referral.js — Utility functions for the Referral System
 *
 * Generates unique, email-based referral codes and handles
 * capturing referral codes from URL query parameters.
 */

/**
 * Converts an email into a clean, URL-safe referral code suffix.
 * e.g. "tanvinur.safi@gmail.com"  →  "tanvinur-safi-a3f9"
 */
export function generateReferralCode(email) {
    if (!email) return null;

    // Take only the local part (before @), lowercase it,
    // replace non-alphanumeric chars (dots, underscores, etc.) with dashes
    const localPart = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')   // replace special chars with dash
        .replace(/-+/g, '-')          // collapse consecutive dashes
        .replace(/^-|-$/g, '');       // strip leading/trailing dashes

    // Append a short deterministic hex suffix derived from the full email
    // so two accounts with the same prefix ("john" vs "john") stay unique
    const suffix = hashEmail(email);
    return `${localPart}-${suffix}`;
}

/**
 * Creates a simple 4-char hex string from an email string.
 * Pure JS — no external dependencies needed.
 */
function hashEmail(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // 32-bit integer
    }
    // Convert to unsigned hex and take last 4 chars
    return (hash >>> 0).toString(16).slice(-4);
}

/**
 * Returns the full shareable referral URL for a user.
 * e.g. "https://any.let/signup?ref=tanvinur-safi-a3f9"
 */
export function getReferralLink(referralCode) {
    const base = window.location.origin;
    return `${base}/signup?ref=${referralCode}`;
}

/**
 * Reads the `ref` query parameter from the current URL.
 * Call this on the /signup page to capture who referred the new user.
 * Returns the code string, or null if none present.
 */
export function captureReferralCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref') || null;
}

/**
 * Persists a referral code to sessionStorage so it survives
 * page refreshes during the sign-up flow.
 */
export function storeReferralCode(code) {
    if (code) sessionStorage.setItem('pendingReferralCode', code);
}

/**
 * Retrieves the stored referral code from sessionStorage.
 */
export function getStoredReferralCode() {
    return sessionStorage.getItem('pendingReferralCode');
}

/**
 * Clears the referral code from sessionStorage after it has been
 * successfully written to Firestore during account creation.
 */
export function clearStoredReferralCode() {
    sessionStorage.removeItem('pendingReferralCode');
}

/**
 * Formats a BDT amount for display.
 */
export function formatBDT(amount = 0) {
    return `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
