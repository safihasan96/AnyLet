import AsyncStorage from '@react-native-async-storage/async-storage';

export function generateReferralCode(email) {
    if (!email) return null;

    const localPart = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')   
        .replace(/-+/g, '-')          
        .replace(/^-|-$/g, '');       

    const suffix = hashEmail(email);
    return `${localPart}-${suffix}`;
}

function hashEmail(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; 
    }
    return (hash >>> 0).toString(16).slice(-4);
}

export function getReferralLink(referralCode) {
    // For mobile app sharing, we point to the web signup flow with the referral code
    return `https://rentbd-e23ed.firebaseapp.com/signup?ref=${referralCode}`;
}

export async function storeReferralCode(code) {
    if (code) {
        await AsyncStorage.setItem('pendingReferralCode', code);
    }
}

export async function getStoredReferralCode() {
    return await AsyncStorage.getItem('pendingReferralCode');
}

export async function clearStoredReferralCode() {
    await AsyncStorage.removeItem('pendingReferralCode');
}

export function formatBDT(amount = 0) {
    return `৳${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
