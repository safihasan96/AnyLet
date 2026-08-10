/**
 * Enterprise Logger Utility
 * --------------------------
 * - In development: logs to console with prefixed context
 * - In production: swallows logs silently (no console pollution)
 * - Drop-in replacement for console.log / console.error
 * - Ready to wire into Sentry / Datadog by replacing the production stubs
 *
 * Usage:
 *   import logger from '../utils/logger';
 *   logger.info('User action', { uid, propertyId });
 *   logger.error('Firestore write failed', error);
 *   logger.debug('Dev-only trace', data); // stripped in prod automatically
 */

const IS_PROD = import.meta.env.PROD;

// ── Stub for production error reporting ─────────────────────────────────────
// Replace captureError body with: Sentry.captureException(err) once Sentry is wired up.
function captureError(context, err) {
    // TODO: wire to Sentry / Datadog in production
    // e.g. Sentry.captureException(err, { extra: { context } });
    void context;
    void err;
}

// ── Logger ──────────────────────────────────────────────────────────────────
const logger = {
    /**
     * General info — dev only, stripped in prod.
     * Replaces: console.log(...)
     */
    info(message, data) {
        if (!IS_PROD) {
            data !== undefined ? console.log(`[INFO] ${message}`, data) : console.log(`[INFO] ${message}`);
        }
    },

    /**
     * Debug trace — dev only, stripped in prod.
     * Replaces: console.log('[DEBUG] ...')
     */
    debug(message, data) {
        if (!IS_PROD) {
            data !== undefined ? console.log(`[DEBUG] ${message}`, data) : console.log(`[DEBUG] ${message}`);
        }
    },

    /**
     * Warning — dev only.
     * Replaces: console.warn(...)
     */
    warn(message, data) {
        if (!IS_PROD) {
            data !== undefined ? console.warn(`[WARN] ${message}`, data) : console.warn(`[WARN] ${message}`);
        }
    },

    /**
     * Error — always captures; logs to console in dev, sends to error reporter in prod.
     * Replaces: console.error(...)
     */
    error(context, err) {
        if (!IS_PROD) {
            console.error(`[ERROR] ${context}`, err ?? '');
        }
        captureError(context, err);
    },
};

export default logger;
