import { useState, useCallback } from 'react';
import { getApiUrl } from '../utils/api';
import logger from '../utils/logger';

/**
 * usePaymentVerification — owns the /api/verify-payment network call and the
 * resulting `verifyResult` state. Extracted from PaymentModal so the modal shell
 * only drives the step machine.
 *
 * `verifyPayment(trimmedId)` posts the transaction to the backend and resolves
 * to `true` on success / `false` on failure (never throws). Amount/price are
 * never sent from the client — the server is the source of truth.
 */
export default function usePaymentVerification({
    currentUser,
    normalizedBookingType,
    selectedMethod,
    propertyId,
    months,
    metadata,
    onPaymentSubmitted,
}) {
    const [verifyResult, setVerifyResult] = useState(null);

    const verifyPayment = useCallback(async (trimmedId) => {
        try {
            const token = await currentUser.getIdToken(/* forceRefresh */ true);
            const response = await fetch(getApiUrl('/api/verify-payment'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                // Only send what the server needs. Never send amount/price from frontend.
                body: JSON.stringify({
                    transactionId: trimmedId,
                    bookingType: normalizedBookingType,
                    provider: selectedMethod || undefined,
                    propertyId: propertyId || undefined,
                    months,
                    onsiteVerification: metadata?.onsiteVerification === true,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.success) {
                setVerifyResult({ success: true, ...data });
                if (onPaymentSubmitted) await onPaymentSubmitted(data.paymentId);
                return true;
            }

            setVerifyResult({ success: false, error: data.error || 'Verification failed. Please try again.' });
            logger.error('[PaymentModal] Verification failed:', data.error);
            return false;
        } catch (err) {
            logger.error('[PaymentModal] Network error during verification:', err);
            setVerifyResult({ success: false, error: 'Network error. Please check your connection and try again.' });
            return false;
        }
    }, [currentUser, normalizedBookingType, selectedMethod, propertyId, months, metadata, onPaymentSubmitted]);

    return { verifyResult, setVerifyResult, verifyPayment };
}
