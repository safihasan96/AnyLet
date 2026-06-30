import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function normalizePrivateKey(value) {
  return typeof value === 'string' ? value.replace(/\\n/g, '\n') : value;
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

if (!getApps().length) {
  initializeApp({
    credential: cert(loadServiceAccount()),
  });
}

const db = getFirestore();
const auth = getAuth();

export { db, auth };
