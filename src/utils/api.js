import { Capacitor } from '@capacitor/core';

/**
 * Returns the correct API URL for fetch calls.
 * - On Web (Vercel): Returns relative URL (e.g., '/api/cloudinary-sign')
 * - On Mobile (Capacitor): Returns absolute URL (e.g., 'https://anylet.com/api/cloudinary-sign')
 */
export const getApiUrl = (endpoint) => {
    // If running in a web browser, use relative paths so Vercel serverless functions work natively
    if (!Capacitor.isNativePlatform()) {
        return endpoint;
    }
    
    // If running in Capacitor (Android/iOS), relative paths hit http://localhost which fails.
    // We must use the absolute production backend URL.
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://anylet.com';
    
    // Ensure endpoint starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    return `${baseUrl.replace(/\/$/, '')}${formattedEndpoint}`;
};
