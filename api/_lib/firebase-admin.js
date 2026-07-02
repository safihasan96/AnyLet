import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function normalizePrivateKey(value) {
  if (typeof value !== 'string') return value;
  let clean = value;
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1);
  }
  return clean.replace(/\\n/g, '\n');
}

function loadServiceAccount() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (encoded) {
    const json = Buffer.from(encoded, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(json);
    return {
      ...serviceAccount,
      private_key: normalizePrivateKey(serviceAccount.private_key),
    };
  }

  if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    };
  }

  throw new Error('Missing Firebase Admin credentials');
}

let db;
let auth;

try {
  if (!getApps().length) {
    initializeApp({
      credential: cert(loadServiceAccount()),
    });
  }
  db = getFirestore();
  auth = getAuth();
} catch (error) {
  // Rethrow so any API route that imports this module will fail at startup
  // with a clear message, instead of crashing at runtime with "Cannot call
  // .collection() on null".
  console.error('[Firebase Admin] FATAL — could not initialize:', error.message);
  throw new Error(`[Firebase Admin] Initialization failed: ${error.message}`);
}

// ── admin namespace ──────────────────────────────────────────────────────────
// Provides a drop-in compatibility shim so existing code using the
// legacy `admin.firestore.Timestamp.now()` / `admin.firestore.FieldValue.*`
// pattern continues to work without any changes to the calling files.
const admin = {
  firestore: {
    Timestamp,
    FieldValue,
  },
};

export { db, auth, admin };
