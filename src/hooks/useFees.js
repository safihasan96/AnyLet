import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Default fallback fees matching the seed config to avoid UI flashes
const DEFAULT_FEES = {
  listingFee: { type: "flat", value: 49, currency: "BDT" },
  onsiteVerificationFee: { type: "flat", value: 299, currency: "BDT" },
  standaloneVerificationFee: { type: "flat", value: 199, currency: "BDT" },
  subscriptionMonthlyPrice: { type: "flat", value: 999, currency: "BDT" },
  depositServiceFee: { type: "flat", value: 99, currency: "BDT" },
  commissionRate: { type: "percentage", value: 0.50 },
  withdrawalLimits: { minAmount: 500, maxAmount: 25000, currency: "BDT" }
};

// Cross-instance cache so repeat mounts don't flash the loading state.
// (No `isFetching` singleton — that pattern deadlocked when the first
// subscriber unmounted before the snapshot resolved.)
let cachedFees = null;

// Never block the UI on the fees read for longer than this. If the
// platformConfig/fees listener hangs (e.g. App Check / network), we fall
// back to DEFAULT_FEES so pages gated on `loading` still render.
const FEES_TIMEOUT_MS = 4000;

export function useFees() {
  const [fees, setFees] = useState(cachedFees || DEFAULT_FEES);
  const [loading, setLoading] = useState(!cachedFees);

  useEffect(() => {
    // Already cached → initial useState above already reflects it; nothing to do.
    if (cachedFees) return;

    let settled = false;
    const settle = () => {
      if (!settled) {
        settled = true;
        setLoading(false); // DEFAULT_FEES is already in state as the fallback
      }
    };

    const timer = setTimeout(settle, FEES_TIMEOUT_MS);

    const docRef = doc(db, 'platformConfig', 'fees');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          cachedFees = docSnap.data();
          setFees(cachedFees);
        }
        clearTimeout(timer);
        settle();
      },
      (err) => {
        console.error('Error fetching fees:', err);
        clearTimeout(timer);
        settle();
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return { fees, loading };
}
