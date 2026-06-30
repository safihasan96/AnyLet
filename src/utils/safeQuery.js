// src/utils/safeQuery.js
// ============================================================
// SAFE QUERY GUARD — F-08 REMEDIATION
// Use safeDocs() instead of getDocs() everywhere in the app.
// If a query has no .limit(), this function will inject HARD_CAP
// and print a warning so the developer knows to fix it.
// ============================================================

import { getDocs, query, limit as firestoreLimit } from 'firebase/firestore';
import QUERY_LIMITS from '../config/queryLimits';
import logger from './logger';

/**
 * Safe replacement for getDocs.
 * Enforces a query limit at all times.
 *
 * @param {import('firebase/firestore').Query} q - A Firestore query reference.
 * @param {number} [explicitLimit] - Optional explicit limit to apply to this query.
 *   If omitted and the query has no limit clause, HARD_CAP is applied automatically.
 * @returns {Promise<import('firebase/firestore').QuerySnapshot>}
 */
export async function safeDocs(q, explicitLimit) {
  // If the caller provided an explicit limit, apply it.
  // This is the recommended usage: always pass a limit from QUERY_LIMITS.
  if (explicitLimit !== undefined) {
    const boundedLimit = Math.min(explicitLimit, QUERY_LIMITS.HARD_CAP);
    const boundedQuery = query(q, firestoreLimit(boundedLimit));
    return getDocs(boundedQuery);
  }

  // No explicit limit was given. Inspect the query for an existing limit clause.
  // Firebase SDK stores query modifiers in _query.explicitOrderBy, _limitType, _limit.
  // We check the internal _limit property as a fallback detection.
  const hasLimit = q._query && q._query._limit !== null && q._query._limit !== undefined;

  if (!hasLimit) {
    // Developer forgot to add a limit. Apply the hard cap and warn loudly.
    if (process.env.DEV) {
      logger.warn(
        '[safeQuery] ⚠️  F-08 GUARD: A query was executed without a .limit() clause. ' +
        `HARD_CAP (${QUERY_LIMITS.HARD_CAP}) has been applied automatically. ` +
        'Please add an explicit limit from QUERY_LIMITS to fix this warning.',
        q
      );
    }
    const guardedQuery = query(q, firestoreLimit(QUERY_LIMITS.HARD_CAP));
    return getDocs(guardedQuery);
  }

  // Query already has a limit. Check it does not exceed HARD_CAP.
  const existingLimit = q._query._limit;
  if (existingLimit > QUERY_LIMITS.HARD_CAP) {
    if (process.env.DEV) {
      logger.error(
        `[safeQuery] ❌ F-08 GUARD: Query limit ${existingLimit} exceeds HARD_CAP ` +
        `(${QUERY_LIMITS.HARD_CAP}). Capping to HARD_CAP.`
      );
    }
    const cappedQuery = query(q, firestoreLimit(QUERY_LIMITS.HARD_CAP));
    return getDocs(cappedQuery);
  }

  return getDocs(q);
}

/**
 * Builds a bounded Firestore query.
 * Wraps Firestore's query() and always appends a .limit() clause.
 *
 * @param {import('firebase/firestore').CollectionReference} collectionRef
 * @param {...import('firebase/firestore').QueryConstraint} constraints
 * @param {number} limitValue - Must be the last argument.
 * @returns {import('firebase/firestore').Query}
 *
 * Usage:
 *   const q = boundedQuery(collection(db, 'properties'), where(...), orderBy(...), QUERY_LIMITS.PROPERTIES_SEARCH);
 */
export function boundedQuery(collectionRef, ...args) {
  // The last argument is always the limit value (a number).
  const constraints = args.slice(0, -1);
  const limitValue = args[args.length - 1];

  if (typeof limitValue !== 'number') {
    throw new Error(
      '[safeQuery] boundedQuery() requires a number as the last argument (the limit). ' +
      'Example: boundedQuery(ref, where(...), QUERY_LIMITS.PROPERTIES_SEARCH)'
    );
  }

  const safeLimit = Math.min(limitValue, QUERY_LIMITS.HARD_CAP);
  return query(collectionRef, ...constraints, firestoreLimit(safeLimit));
}
