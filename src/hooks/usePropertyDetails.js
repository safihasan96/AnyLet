import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import QUERY_LIMITS from '../config/queryLimits';
import logger from '../utils/logger';

/**
 * usePropertyDetails — loads a single property plus its owner, rental-history
 * count, and whether the current user already has a recent viewing request.
 * Extracted verbatim from PropertyDetails so the page can stay a thin shell.
 *
 * `setRequestSent` is returned because the page's handleSendRequest also flips
 * it after a successful submission.
 */
export default function usePropertyDetails(id, currentUser) {
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [owner, setOwner] = useState(null);
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const docRef = doc(db, 'properties', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const propData = { id: docSnap.id, ...docSnap.data() };
                    setProperty(propData);

                    // Fetch actual owner
                    // NOTE: Firestore rules restrict users/{uid} reads to the
                    // document owner. A tenant viewing someone else's property
                    // will get permission-denied here — that's expected.
                    const ownerIdToFetch = propData.ownerId || propData.userId;
                    if (ownerIdToFetch) {
                        try {
                            const ownerDoc = await getDoc(doc(db, 'users', ownerIdToFetch));
                            if (ownerDoc.exists()) {
                                setOwner({ id: ownerDoc.id, ...ownerDoc.data() });
                            }
                        } catch (ownerErr) {
                            // Permission denied — tenant can't read owner's user doc
                            logger.warn('Could not read owner user doc on page load.', ownerErr);
                        }
                    }

                    // Fetch rental history count
                    try {
                        // ✅ F-08: bounded
                        const moveInsQ = query(
                            collection(db, 'tenantMoveIns'),
                            where('propertyId', '==', id),
                            where('status', '==', 'active'),
                            limit(QUERY_LIMITS.HARD_CAP)
                        );
                        const moveInsSnap = await getDocs(moveInsQ);
                        propData.rentHistoryCount = moveInsSnap.size;
                    } catch {
                        propData.rentHistoryCount = 0;
                    }

                    // Check if current user already requested this property recently
                    if (currentUser) {
                        try {
                            // ✅ F-08: bounded — only fetch the last 50 requests for this tenant
                            const reqQ = query(
                                collection(db, 'viewing_requests'),
                                where('tenantId', '==', currentUser.uid),
                                limit(50)
                            );
                            const reqSnap = await getDocs(reqQ);
                            const fortyEightHoursAgoMs = Date.now() - 48 * 60 * 60 * 1000;

                            const hasRecentRequest = reqSnap.docs.some(d => {
                                const data = d.data();
                                if (data.propertyId !== id) return false;

                                let createdMs = 0;
                                if (data.createdAt) {
                                    if (typeof data.createdAt.toMillis === 'function') {
                                        createdMs = data.createdAt.toMillis();
                                    } else if (data.createdAt instanceof Date) {
                                        createdMs = data.createdAt.getTime();
                                    } else if (typeof data.createdAt.seconds === 'number') {
                                        createdMs = data.createdAt.seconds * 1000;
                                    }
                                }

                                if (createdMs === 0) return false;
                                return createdMs >= fortyEightHoursAgoMs;
                            });

                            if (hasRecentRequest) {
                                setRequestSent(true);
                            }
                        } catch {
                            // Silently ignore — non-critical check
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id, currentUser]);

    return { property, loading, owner, requestSent, setRequestSent };
}
