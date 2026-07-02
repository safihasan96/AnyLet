import { db } from './api/_lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

async function seed() {
  const feesRef = db.doc('platformConfig/fees');
  const doc = await feesRef.get();
  
  if (doc.exists) {
    console.log('platformConfig/fees already exists.');
    process.exit(0);
  }

  const defaultFees = {
    listingFee: { type: "flat", value: 49, currency: "BDT" },
    onsiteVerificationFee: { type: "flat", value: 299, currency: "BDT" },
    standaloneVerificationFee: { type: "flat", value: 199, currency: "BDT" },
    subscriptionMonthlyPrice: { type: "flat", value: 999, currency: "BDT" },
    depositServiceFee: { type: "flat", value: 99, currency: "BDT" },
    commissionRate: { type: "percentage", value: 0.50 },
    withdrawalLimits: { 
      minAmount: 500, 
      maxAmount: 25000, 
      currency: "BDT" 
    },
    lastUpdatedBy: "system_migration",
    lastUpdatedAt: FieldValue.serverTimestamp(),
    version: 1
  };

  await feesRef.set(defaultFees);
  
  // Write to history
  const historyRef = feesRef.collection('history').doc();
  await historyRef.set({
    previousConfig: null,
    newConfig: defaultFees,
    changedBy: "system_migration",
    changedAt: FieldValue.serverTimestamp(),
    reason: "Initial migration from hardcoded fees"
  });

  console.log('Successfully seeded platformConfig/fees');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
