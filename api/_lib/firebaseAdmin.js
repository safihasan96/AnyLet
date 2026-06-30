// Thin compatibility re-export shim.
// Everything is now in firebase-admin.js — this file exists so older imports
// pointing to firebaseAdmin.js (capital A) continue to work without changes.
export { db, auth, admin } from './firebase-admin.js';
