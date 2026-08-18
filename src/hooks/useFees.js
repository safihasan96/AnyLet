import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

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

let cachedFees = null;
let isFetching = false;
let fetchPromise = null;

export function useFees() {
  const [fees, setFees] = useState(cachedFees || DEFAULT_FEES);
  const [loading, setLoading] = useState(!cachedFees);

  useEffect(() => {
    let unsubscribe = null;

    if (cachedFees) {
      setFees(cachedFees);
      setLoading(false);
    } else if (!isFetching) {
      isFetching = true;
      const docRef = doc(db, 'platformConfig', 'fees');
      
      // Setup realtime listener for dynamic fee updates
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          cachedFees = data;
          setFees(data);
        }
        setLoading(false);
        isFetching = false;
      }, (err) => {
        console.error("Error fetching fees:", err);
        setLoading(false);
        isFetching = false;
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { fees, loading };
}
