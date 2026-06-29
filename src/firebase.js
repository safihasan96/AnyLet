import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, CustomProvider } from "firebase/app-check";

// Your web app's Firebase configuration using Environment Variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;

if (typeof window !== "undefined") {
    analytics = getAnalytics(app);

    const isDev = import.meta.env.DEV ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.');

    if (isDev) {
        // In development, use a debug token so AppCheck doesn't block Auth & Firestore.
        // The debug token is set globally before initializeAppCheck is called.
        // This never runs in production builds (import.meta.env.DEV is false after `vite build`).
        // eslint-disable-next-line no-restricted-globals
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        initializeAppCheck(app, {
            provider: new CustomProvider({
                getToken: () => Promise.resolve({ token: 'debug-token', expireTimeMillis: Date.now() + 3600 * 1000 }),
            }),
            isTokenAutoRefreshEnabled: true,
        });
    } else {
        // Production: use reCAPTCHA Enterprise for real bot protection
        initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider('6Lfs1zotAAAAAG5c73YvfdkwUFmJTIWWXMbkCQL_'),
            isTokenAutoRefreshEnabled: true,
        });
    }
}

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Firebase Authentication with persistent sessions
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Google Auth Provider — configured for account linking
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firebase Storage
export const storage = getStorage(app);

