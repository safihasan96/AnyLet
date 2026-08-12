import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getApiUrl } from '../utils/api';
import logger from '../utils/logger';

/**
 * useImageUpload — encapsulates the Cloudinary signed-upload flow and its own
 * `uploading` state. Extracted from AddProperty so the page shell doesn't have
 * to manage upload UI state manually.
 *
 * `uploadImages(files)` fetches a signature from /api/cloudinary-sign, uploads
 * each file to Cloudinary, and resolves to an array of secure URLs. On any
 * failure it surfaces a toast and resolves to `[]` (partial uploads are
 * discarded — matching the original behavior).
 */
export default function useImageUpload() {
    const { currentUser } = useAuth();
    const toast = useToast();
    const [uploading, setUploading] = useState(false);

    const uploadImages = async (files) => {
        setUploading(true);
        const uploadedUrls = [];

        try {
            const sigRes = await fetch(getApiUrl('/api/cloudinary-sign'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await currentUser.getIdToken()}`,
                },
                body: JSON.stringify({ isKyc: false })
            });
            const sigData = await sigRes.json();
            if (!sigRes.ok) throw new Error(sigData.error || 'Failed to generate secure upload signature. Ensure backend API keys are configured.');

            for (const file of files) {
                const data = new FormData();
                data.append('file', file);
                data.append('api_key', sigData.apiKey);
                data.append('timestamp', sigData.timestamp);
                data.append('signature', sigData.signature);
                data.append('folder', sigData.folder);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
                    method: 'POST',
                    body: data,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const fileData = await res.json();

                if (!res.ok) {
                    logger.error("Cloudinary Error:", fileData);
                    toast.error(`Upload failed!\nError: ${fileData.error?.message || "Unknown error"}`);
                    throw new Error(fileData.error?.message || 'Upload failed');
                }

                if (fileData.secure_url) {
                    uploadedUrls.push(fileData.secure_url);
                }
            }

            return uploadedUrls;
        } catch (error) {
            logger.error('Error during upload process:', error);
            if (error.name === 'AbortError') {
                toast.error('Upload timed out. Please check your connection and try again.');
            } else if (!error.message?.includes('Upload failed')) {
                // Only show toast if we haven't already shown one from the inner loop
                toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
            }
            return [];
        } finally {
            setUploading(false);
        }
    };

    return { uploading, uploadImages };
}
