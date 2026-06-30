// src/hooks/useFirestoreSnapshot.js
// Enterprise-grade Firestore real-time subscription hook.
// Handles cleanup, loading states, and error capturing automatically.
// Use this instead of writing useEffect + onSnapshot manually.

import { useState, useEffect, useRef } from 'react';
import { onSnapshot } from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * useFirestoreSnapshot
 *
 * Subscribes to a Firestore query or document ref in real-time.
 * Automatically unsubscribes when the component unmounts.
 * Prevents state updates on unmounted components.
 *
 * @param {import('firebase/firestore').Query | import('firebase/firestore').DocumentReference | null} queryOrRef
 *   A Firestore Query or DocumentReference. Pass null to skip subscription (e.g., when user is not yet loaded).
 *
 * @returns {{ data: Array, loading: boolean, error: Error | null }}
 *   - data: Array of documents (for queries) or a single document object (for doc refs)
 *   - loading: true until the first snapshot arrives
 *   - error: Any error caught during subscription
 *
 * @example — Query (collection listener)
 *   const q = useMemo(() => query(collection(db, 'requests'), where('tenantId', '==', uid)), [uid]);
 *   const { data: requests, loading, error } = useFirestoreSnapshot(q);
 *
 * @example — Document listener
 *   const docRef = useMemo(() => doc(db, 'users', uid), [uid]);
 *   const { data: userDoc, loading, error } = useFirestoreSnapshot(docRef);
 *
 * @example — Conditional (wait for auth)
 *   const { data } = useFirestoreSnapshot(currentUser ? q : null);
 *
 * IMPORTANT: Always wrap the query in useMemo() before passing it to this hook.
 * A query object created inline will have a new reference on every render,
 * causing an infinite re-subscription loop.
 */
export function useFirestoreSnapshot(queryOrRef) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // isMounted ref prevents state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    // Mark as mounted at the start of each effect run
    isMounted.current = true;

    // If no query is provided (e.g., user not loaded yet), do nothing
    if (!queryOrRef) {
      if (isMounted.current) {
        setLoading(false);
        setData([]);
      }
      return;
    }

    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }

    // Subscribe to Firestore
    const unsubscribe = onSnapshot(
      queryOrRef,
      (snapshot) => {
        // Guard: do not update state if component has unmounted
        if (!isMounted.current) return;

        // Handle both query snapshots and document snapshots
        if (snapshot.docs) {
          // It's a QuerySnapshot (collection/query)
          const results = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setData(results);
        } else {
          // It's a DocumentSnapshot (single doc)
          if (snapshot.exists()) {
            setData({ id: snapshot.id, ...snapshot.data() });
          } else {
            setData(null);
          }
        }

        setLoading(false);
      },
      (err) => {
        // Guard: do not update state if component has unmounted
        if (!isMounted.current) return;

        logger.error('[useFirestoreSnapshot] Firestore subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // CRITICAL CLEANUP: This is returned so React calls it on unmount or re-run.
    // Without this return, the listener leaks — causing memory bloat and runaway Firestore billing.
    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [queryOrRef]); // Re-subscribe if the query reference changes

  return { data, loading, error };
}
