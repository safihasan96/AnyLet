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

    // Append a short random hex suffix to ensure uniqueness and prevent guessing
    const suffix = generateRandomHex(4);
    return `${localPart}-${suffix}`;
}

/**
 * Creates a random hex string of given length
 */
function generateRandomHex(length) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
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
