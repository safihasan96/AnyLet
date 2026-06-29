import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, CustomProvider } from "firebase/app-check";

import { Capacitor } from '@capacitor/core';

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

// AppCheck has been completely removed as per request to fix native mobile support.
// ReCaptcha Enterprise is fundamentally incompatible with Capacitor Android/iOS builds,
// and without the native AppCheck plugins, it causes the app to hang and block all queries.
if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
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

