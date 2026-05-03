import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import emailjs from '@emailjs/browser';

// --- CONFIGURATION ---
// Replace these with your actual EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_xxxxxx';
const EMAILJS_TEMPLATE_ID = 'template_xxxxxx';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

/**
 * Generates a random 6-digit OTP code.
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends the OTP code to the specified email using EmailJS.
 */
export async function sendOTPEmail(email, fullName, otpCode) {
  try {
    const templateParams = {
      to_email: email,
      to_name: fullName,
      otp_code: otpCode,
    };

    // Note: This will fail if the keys above are not configured.
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    return response;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
}

/**
 * Stores the OTP and timestamp in Firestore for verification.
 */
export async function storeOTP(email, otpCode) {
  try {
    const otpRef = doc(db, 'otp_verifications', email);
    await setDoc(otpRef, {
      code: otpCode,
      createdAt: serverTimestamp(),
      expiresAt: Date.now() + 10 * 60 * 1000, // Expires in 10 minutes
    });
  } catch (error) {
    console.error('Error storing OTP in Firestore:', error);
    throw error;
  }
}

/**
 * Verifies if the provided OTP code matches the stored one for the email.
 */
export async function verifyOTP(email, providedCode) {
  try {
    const otpRef = doc(db, 'otp_verifications', email);
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      return { success: false, message: 'No verification code found. Please resend.' };
    }

    const data = otpSnap.data();
    
    // Check if the code has expired
    if (data.expiresAt < Date.now()) {
      return { success: false, message: 'Verification code has expired. Please resend.' };
    }

    if (data.code === providedCode) {
      return { success: true };
    } else {
      return { success: false, message: 'Incorrect verification code. Please try again.' };
    }
  } catch (error) {
    console.error('Error verifying OTP in Firestore:', error);
    throw error;
  }
}
