import admin from 'firebase-admin';

// Initialize with application default credentials, or look for service account
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
async function run() {
    try {
        const snapshot = await db.collection('properties').where('status', '==', 'Available').limit(5).get();
        console.log("Found:", snapshot.size);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(doc.id, "createdAt:", typeof data.createdAt, "updatedAt:", typeof data.updatedAt);
        });
    } catch(e) {
        console.error(e.message);
    }
}
run();
