import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function useSavedProperties() {
    const { currentUser } = useAuth();
    const [savedProperties, setSavedProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setSavedProperties([]);
            setLoading(false);
            return;
        }

        const userRef = doc(db, 'users', currentUser.uid);

        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSavedProperties(data.savedProperties || []);
            } else {
                setSavedProperties([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching saved properties:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    const toggleSaveProperty = async (propertyId, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation(); // Stop event bubbling to parent links
        }

        if (!currentUser) {
            // Might want to toast this in the future or redirect to login.
            alert("Please login to save properties");
            return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const isSaved = savedProperties.includes(propertyId);

        try {
            // Optimistic update locally
            setSavedProperties(prev =>
                isSaved ? prev.filter(id => id !== propertyId) : [...prev, propertyId]
            );

            // Sync with Firestore
            await setDoc(userRef, {
                savedProperties: isSaved ? arrayRemove(propertyId) : arrayUnion(propertyId)
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling saved property:", error);
            // Revert optimistic update on failure
            setSavedProperties(prev =>
                isSaved ? [...prev, propertyId] : prev.filter(id => id !== propertyId)
            );
        }
    };

    const isPropertySaved = (propertyId) => {
        return savedProperties.includes(propertyId);
    };

    return {
        savedProperties,
        toggleSaveProperty,
        isPropertySaved,
        loading
    };
}
