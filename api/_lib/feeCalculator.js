// ═══════════════════════════════════════════════════════════════════════════════
//  SERVER-SIDE FEE CALCULATOR — SINGLE SOURCE OF TRUTH
//  ─────────────────────────────────────────────────────
//  This module is the ONLY place server-side expected amounts are computed.
//  It reads the current fee config from Firestore `platformConfig/fees`.
//
//  ⚠️  DISPLAY ONLY: Any fee values shown on the frontend (AddProperty.jsx,
//      Pricing.jsx, etc.) are fetched from Firestore for UX purposes only.
//      They are NOT authoritative. This file is the enforcement layer.
//
//  Callers:
//    • api/create-payment-intent.js  (tells user how much to pay)
//    • api/verify-payment.js         (confirms the amount paid matches)
//
//  Both must use this module — never their own local constants — so they
//  always agree on the expected amount for any given transaction.
// ═══════════════════════════════════════════════════════════════════════════════

import { db } from './firebase-admin.js';

const BOOKING_TYPES = new Set(['booking', 'subscription', 'deposit', 'listing', 'verification']);

/**
 * Fetches the live fee configuration from Firestore.
 * Throws a 503 if the config document does not exist (mis-configuration).
 * @returns {Promise<Object>} The full platformConfig/fees document data.
 */
export async function getPlatformFees() {
  const snap = await db.collection('platformConfig').doc('fees').get();
  if (!snap.exists) {
    throw Object.assign(
      new Error('Platform fee configuration is missing. Contact support.'),
      { statusCode: 503 }
    );
  }
  return snap.data();
}

/**
 * Computes the exact expected payment amount for a given booking request.
 * This runs entirely server-side — no client input influences the result.
 *
 * @param {Object} params
 * @param {string} params.bookingType   - One of: booking, subscription, deposit, listing, verification
 * @param {string|null} params.propertyId - Required for booking/deposit/verification
 * @param {number} params.months        - Number of subscription months (1–12)
 * @param {boolean} params.onsiteVerification - Whether onsite verification add-on is requested
 * @param {string} params.uid           - Authenticated user UID (for ownership checks)
 * @returns {Promise<{ expectedAmount: number, propertySnapshot: Object|null, fees: Object }>}
 */
export async function computeExpectedAmount({ bookingType, propertyId, months, onsiteVerification, uid }) {
  if (!BOOKING_TYPES.has(bookingType)) {
    throw Object.assign(
      new Error(`bookingType must be one of: ${[...BOOKING_TYPES].join(', ')}`),
      { statusCode: 400 }
    );
  }

  const fees = await getPlatformFees();

  // ── Flat-fee types (no property lookup required) ─────────────────────────
  if (bookingType === 'subscription') {
    const pricePerMonth = Number(fees.subscriptionMonthlyPrice.value);
    const validMonths   = Math.max(1, Math.min(12, Number(months) || 1));
    return {
      expectedAmount:   pricePerMonth * validMonths,
      propertySnapshot: null,
      fees,
    };
  }

  if (bookingType === 'listing') {
    const base   = Number(fees.listingFee.value);
    const addOn  = onsiteVerification ? Number(fees.onsiteVerificationFee.value) : 0;
    return {
      expectedAmount:   base + addOn,
      propertySnapshot: null,
      fees,
    };
  }

  // ── Property-dependent types ──────────────────────────────────────────────
  if (!propertyId || typeof propertyId !== 'string' || propertyId.trim().length === 0) {
    throw Object.assign(
      new Error('propertyId is required for this payment type'),
      { statusCode: 400 }
    );
  }

  const propertySnap = await db.collection('properties').doc(propertyId.trim()).get();
  if (!propertySnap.exists) {
    throw Object.assign(new Error('Property not found'), { statusCode: 404 });
  }

  const property        = propertySnap.data();
  const securityDeposit = Number(property.securityDeposit || 0);
  const rent            = Number(property.rent || 0);
  const propertyOwnerId = property.ownerId || property.userId || null;

  const propertySnapshot = {
    id:              propertyId,
    title:           property.title || `Property ${propertyId.slice(0, 6)}`,
    ownerId:         propertyOwnerId,
    rent,
    securityDeposit,
  };

  if (bookingType === 'verification') {
    if (propertyOwnerId !== uid) {
      throw Object.assign(
        new Error('Only the property owner can request verification'),
        { statusCode: 403 }
      );
    }
    return {
      expectedAmount:   Number(fees.standaloneVerificationFee.value),
      propertySnapshot,
      fees,
    };
  }

  if (bookingType === 'deposit') {
    return {
      expectedAmount:   Math.max(0, securityDeposit) + Number(fees.depositServiceFee.value),
      propertySnapshot,
      fees,
    };
  }

  // bookingType === 'booking' — rent-based, no platform fee added
  return {
    expectedAmount:   Math.max(0, rent),
    propertySnapshot,
    fees,
  };
}
