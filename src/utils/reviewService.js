import { updateDoc, doc, serverTimestamp, getDoc, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from './notificationService';
import logger from './logger';

export const submitPropertyReview = async (propertyId, reviewData) => {
    try {
        const propertyRef = doc(db, 'properties', propertyId);
        const reviewId = `${reviewData.reviewerId}_${propertyId}`;
        const reviewRef = doc(db, 'propertyReviews', reviewId);
        
        await runTransaction(db, async (transaction) => {
            const propertyDoc = await transaction.get(propertyRef);
            const existingReviewDoc = await transaction.get(reviewRef);
            if (!propertyDoc.exists()) {
                throw new Error("Property does not exist!");
            }
            if (existingReviewDoc.exists()) {
                throw new Error("You have already reviewed this property.");
            }

            const propertyData = propertyDoc.data();
            const currentScore = propertyData.reviewScore || 0;
            const currentCount = propertyData.reviewCount || 0;

            // Calculate new average
            const newCount = currentCount + 1;
            const newScore = ((currentScore * currentCount) + reviewData.rating) / newCount;

            // Update property with new stats
            transaction.update(propertyRef, {
                reviewScore: newScore,
                reviewCount: newCount
            });

            transaction.set(reviewRef, {
                ...reviewData,
                propertyId,
                isApproved: true,
                helpfulVotes: 0,
                helpfulUsers: [],
                createdAt: serverTimestamp(),
                landlordReply: null
            });
        });

        // Notify the owner
        if (reviewData.ownerId) {
            await createNotification(
                reviewData.ownerId,
                'review_received',
                'New Property Review',
                `${reviewData.reviewerName || 'A tenant'} left a ${reviewData.rating}-star review for your property.`,
                `/property/${propertyId}/reviews`,
                { propertyId }
            );
        }

        return true;
    } catch (error) {
        logger.error("Error submitting property review:", error);
        throw error;
    }
};

export const submitOwnerReview = async (ownerId, reviewData) => {
     try {
         // Owner reviews don't currently have denormalized stats on the user object, but we could add them if needed.
         // For now, we just add the review document.
         const reviewId = `${reviewData.reviewerId}_${ownerId}`;
         const reviewRef = doc(db, 'ownerReviews', reviewId);

         await runTransaction(db, async (transaction) => {
            const existing = await transaction.get(reviewRef);
            if (existing.exists()) {
                throw new Error("You have already reviewed this owner.");
            }
            transaction.set(reviewRef, {
             ...reviewData,
             ownerId,
             isApproved: true,
             helpfulVotes: 0,
             helpfulUsers: [],
             createdAt: serverTimestamp(),
             landlordReply: null
            });
         });

         // Notify the owner
         await createNotification(
             ownerId,
             'review_received',
             'New Landlord Review',
             `${reviewData.reviewerName || 'A tenant'} left you a ${reviewData.rating}-star review.`,
             `/owner/${ownerId}`,
             { propertyId: reviewData.propertyId }
         );

         return reviewRef.id;
     } catch (error) {
         logger.error("Error submitting owner review:", error);
         throw error;
     }
};

export const toggleHelpfulVote = async (collectionName, reviewId, userId) => {
    try {
        const reviewRef = doc(db, collectionName, reviewId);
        
        await runTransaction(db, async (transaction) => {
            const reviewDoc = await transaction.get(reviewRef);
            if (!reviewDoc.exists()) {
                throw new Error("Review does not exist!");
            }

            const reviewData = reviewDoc.data();
            const helpfulUsers = reviewData.helpfulUsers || [];
            
            if (helpfulUsers.includes(userId)) {
                // Remove vote
                transaction.update(reviewRef, {
                    helpfulUsers: arrayRemove(userId),
                    helpfulVotes: Math.max(0, (reviewData.helpfulVotes || 1) - 1)
                });
            } else {
                // Add vote
                transaction.update(reviewRef, {
                    helpfulUsers: arrayUnion(userId),
                    helpfulVotes: (reviewData.helpfulVotes || 0) + 1
                });
                
                // Notify reviewer that their review was helpful
                // (Only if it's not their own vote)
                if (reviewData.reviewerId !== userId) {
                     // We run this outside the transaction in a normal app, but it's fine here as a floating promise.
                     createNotification(
                         reviewData.reviewerId,
                         'system',
                         'Helpful Review',
                         `Someone found your review helpful!`,
                         collectionName === 'propertyReviews' ? `/property/${reviewData.propertyId}` : `/owner/${reviewData.ownerId}`
                     ).catch(console.error);
                }
            }
        });
        
        return true;
    } catch (error) {
        logger.error("Error toggling helpful vote:", error);
        throw error;
    }
};

export const submitLandlordReply = async (collectionName, reviewId, replyText, ownerId, ownerName) => {
     try {
         const reviewRef = doc(db, collectionName, reviewId);
         
         const replyData = {
             text: replyText,
             ownerId: ownerId,
             ownerName: ownerName,
             createdAt: new Date() // Firestore timestamp equivalent for immediate update
         };

         await updateDoc(reviewRef, {
             landlordReply: replyData
         });

         // Get the review to notify the reviewer
         const reviewDoc = await getDoc(reviewRef);
         if (reviewDoc.exists()) {
             const reviewData = reviewDoc.data();
             if (reviewData.reviewerId) {
                  await createNotification(
                      reviewData.reviewerId,
                      'review_received',
                      'Landlord Replied',
                      `${ownerName} replied to your review.`,
                      collectionName === 'propertyReviews' ? `/property/${reviewData.propertyId}` : `/owner/${reviewData.ownerId}`
                  );
             }
         }

         return true;
     } catch (error) {
         logger.error("Error submitting landlord reply:", error);
         throw error;
     }
};
