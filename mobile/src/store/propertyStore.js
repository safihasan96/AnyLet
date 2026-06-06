import { create } from 'zustand';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePropertyStore = create((set, get) => {
    let unsubscribeListings = null;

    return {
        properties: [],
        loading: true,
        offlineMode: false,

        loadCachedProperties: async () => {
            try {
                const cached = await AsyncStorage.getItem('cached-properties');
                if (cached) {
                    set({ properties: JSON.parse(cached), loading: false, offlineMode: true });
                }
            } catch (err) {
                console.error("Zustand Properties: failed to load cached items:", err);
            }
        },

        fetchProperties: () => {
            // Cancel existing subscription if any
            if (unsubscribeListings) {
                unsubscribeListings();
            }

            set({ loading: true });

            const q = query(
                collection(db, 'properties'),
                orderBy('createdAt', 'desc')
            );

            unsubscribeListings = onSnapshot(q, async (snapshot) => {
                const listings = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        // Ensure compatibility with image_url requests
                        image: data.image || data.imageUrl || data.image_url || (data.images && data.images[0]),
                        isApproved: data.isApproved !== false
                    };
                });

                set({ properties: listings, loading: false, offlineMode: false });
                
                // Cache locally
                try {
                    await AsyncStorage.setItem('cached-properties', JSON.stringify(listings));
                } catch (err) {
                    console.error("Zustand Properties: failed to cache:", err);
                }
            }, (error) => {
                console.error("Zustand Properties: fetch error:", error);
                set({ loading: false });
                // Fallback to cache if database connection fails
                get().loadCachedProperties();
            });

            return unsubscribeListings;
        },

        addProperty: async (propertyData) => {
            const docRef = await addDoc(collection(db, 'properties'), {
                ...propertyData,
                isApproved: true, // Default to true or let admin approve
                createdAt: serverTimestamp()
            });
            return docRef.id;
        },

        updateProperty: async (propertyId, patch) => {
            const docRef = doc(db, 'properties', propertyId);
            await updateDoc(docRef, patch);
        },

        deleteProperty: async (propertyId) => {
            const docRef = doc(db, 'properties', propertyId);
            await deleteDoc(docRef);
        },

        destroyListener: () => {
            if (unsubscribeListings) {
                unsubscribeListings();
                unsubscribeListings = null;
            }
        }
    };
});
