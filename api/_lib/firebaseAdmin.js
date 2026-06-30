import { db, auth, admin } from './firebase-admin.js';

export function initAdmin() {
  return admin.app();
}

export function adminAuth() {
  return auth;
}

export function adminDb() {
  return db;
}

export { db, auth, admin };
