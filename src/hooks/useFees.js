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

export function useFees() {
  const [fees, setFees] = useState(DEFAULT_FEES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'platformConfig', 'fees');
    
    // Setup realtime listener for dynamic fee updates
    // Firestore automatically handles local caching and deduplication
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setFees(docSnap.data());
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching fees:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { fees, loading };
}
