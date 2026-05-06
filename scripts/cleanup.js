import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, addDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration (from scripts/check.js)
const firebaseConfig = {
    apiKey: "AIzaSyBbZiwo3yw0OMDqLJBX9THrSeF5R_djJQY",
    authDomain: "rentbd-e23ed.firebaseapp.com",
    projectId: "rentbd-e23ed",
    storageBucket: "rentbd-e23ed.firebasestorage.app",
    messagingSenderId: "52925845671",
    appId: "1:52925845671:web:6e00097d24753a0eaccb82"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateAndCleanup() {
    console.log("🚀 Starting Firebase Cleanup...");

    // 1. CLEANUP LISTINGS -> PROPERTIES
    const listingCollections = ['listings', 'Listings'];
    const targetListingCollection = 'properties';

    for (const source of listingCollections) {
        console.log(`\nChecking source collection: '${source}'...`);
        try {
            const snap = await getDocs(collection(db, source));
            if (snap.empty) {
                console.log(`- '${source}' is already empty.`);
                continue;
            }

            console.log(`- Found ${snap.size} items in '${source}'. Migrating to '${targetListingCollection}'...`);
            for (const lDoc of snap.docs) {
                const data = lDoc.data();
                await addDoc(collection(db, targetListingCollection), {
                    ...data,
                    ownerId: data.ownerId || data.landlordId || data.userId || data.creatorId,
                    isApproved: data.isApproved ?? true,
                    migratedAt: serverTimestamp(),
                    migrationSource: source
                });
                await deleteDoc(doc(db, source, lDoc.id));
                console.log(`  - Migrated and deleted document ${lDoc.id}`);
            }
            console.log(`✅ Finished migrating '${source}'.`);
        } catch (e) {
            console.error(`❌ Error migrating '${source}':`, e.message);
        }
    }

    // 2. CLEANUP REDUNDANT USER COLLECTIONS -> USERS
    const userCollections = ['Users', 'Profiles', 'user_profiles'];
    const targetUserCollection = 'users';

    for (const source of userCollections) {
        console.log(`\nChecking source collection: '${source}'...`);
        try {
            const snap = await getDocs(collection(db, source));
            if (snap.empty) {
                console.log(`- '${source}' is already empty.`);
                continue;
            }

            console.log(`- Found ${snap.size} items in '${source}'. Migrating to '${targetUserCollection}'...`);
            for (const uDoc of snap.docs) {
                const data = uDoc.data();
                // For users, we typically use the auth UID as document ID. 
                // We'll use setDoc with merge to avoid overwriting existing data in 'users'.
                await setDoc(doc(db, targetUserCollection, uDoc.id), {
                    ...data,
                    migratedAt: serverTimestamp(),
                    migrationSource: source
                }, { merge: true });
                await deleteDoc(doc(db, source, uDoc.id));
                console.log(`  - Migrated/Merged and deleted user document ${uDoc.id}`);
            }
            console.log(`✅ Finished migrating '${source}'.`);
        } catch (e) {
            console.error(`❌ Error migrating '${source}':`, e.message);
        }
    }

    console.log("\n✨ Cleanup process complete!");
    process.exit(0);
}

migrateAndCleanup();
