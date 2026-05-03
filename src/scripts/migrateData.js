
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function migrateListingsToProperties() {
    console.log("Starting migration: listings -> properties...");
    let count = 0;

    try {
        const listingsSnap = await getDocs(collection(db, 'listings'));

        for (const listingDoc of listingsSnap.docs) {
            const data = listingDoc.data();

            // Normalize data if needed
            const normalizedData = {
                ...data,
                ownerId: data.ownerId || data.landlordId || data.userId,
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'properties'), normalizedData);
            await deleteDoc(doc(db, 'listings', listingDoc.id));
            count++;
        }

        console.log(`Migration complete! Moved ${count} items.`);
        return count;
    } catch (err) {
        console.error("Migration failed:", err);
        throw err;
    }
}
