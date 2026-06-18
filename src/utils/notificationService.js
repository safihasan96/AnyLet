import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import logger from './logger';

/**
 * Creates a notification in the Firestore `notifications` collection.
 * 
 * @param {string} userId - The UID of the user who will receive the notification.
 * @param {string} type - 'request_received' | 'booking_confirmed' | 'property_approved' | 'review_received' | 'system'
 * @param {string} title - The title of the notification.
 * @param {string} message - The details of the notification.
 * @param {string} link - The URL to redirect to when clicked.
 * @param {object} metadata - Any additional data to store (e.g., propertyId, senderId).
 */
export const createNotification = async (userId, type, title, message, link, metadata = {}) => {
    if (!userId) {
        logger.error("createNotification: userId is required");
        return;
    }

    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            type,
            title,
            message,
            link,
            isRead: false,
            createdAt: serverTimestamp(),
            metadata
        });
    } catch (error) {
        logger.error("Error creating notification:", error);
    }
};
