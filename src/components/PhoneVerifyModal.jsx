import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, X, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BD_PHONE_RE = /^(?:\+880|0)1[3-9]\d{8}$/;
const INTL_PHONE_RE = /^\+?[1-9]\d{6,14}$/;

function isValidPhone(num) {
    const clean = num.replace(/\s|-/g, '');
    return BD_PHONE_RE.test(clean) || INTL_PHONE_RE.test(clean);
}

/**
 * PhoneVerifyModal — inline prompt for users who try to contact a host
 * without a verified phone number. Does NOT navigate away from the page.
 *
 * Props:
 *   isOpen    — boolean
 *   onClose   — fn
 *   onSuccess — fn called after phone is successfully saved
 */
export default function PhoneVerifyModal({ isOpen, onClose, onSuccess }) {
    const { updateUserProfile } = useAuth();
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleSubmit() {
        const clean = phone.replace(/\s|-/g, '');
        if (!clean) { setError('Please enter your phone number.'); return; }
        if (!isValidPhone(clean)) {
            setError('Enter a valid BD number (01XXXXXXXXX) or international number with country code.');
            return;
        }
        setSaving(true);
        try {
            await updateUserProfile({
                'personalDetails.phoneNumber': clean,
                'personalDetails.isPhoneVerified': true,
            });
            setPhone('');
            setError('');
            onClose();
            onSuccess?.();
        } catch {
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="phone-modal-backdrop"
                    className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" />
                    <motion.div
                        className="relative w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-[36px] sm:rounded-[36px] p-8 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                    >
                        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                            <X size={16} />
                        </button>

                        {/* Icon */}
                        <div className="size-14 rounded-2xl bg-[#1a227f]/10 flex items-center justify-center mb-5">
                            <Phone size={24} className="text-[#1a227f] dark:text-indigo-400" />
                        </div>

                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Add your phone number</h2>
                        <p className="text-sm font-medium text-slate-500 mb-6">
                            Hosts can only be contacted by verified tenants. Add your number to continue.
                        </p>

                        <div className="flex gap-2 mb-3">
                            <div className="flex items-center px-3 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 text-sm whitespace-nowrap">
                                🇧🇩 +880
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => { setPhone(e.target.value); setError(''); }}
                                placeholder="01712 345 678"
                                className="flex-1 px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:border-[#1a227f] focus:outline-none transition-colors text-sm"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-rose-500">
                                <AlertCircle size={12} /> {error}
                            </div>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSubmit}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-[#1a227f] text-white font-black rounded-2xl shadow-lg shadow-[#1a227f]/20 disabled:opacity-70 mb-3"
                        >
                            {saving ? 'Saving...' : <><ArrowRight size={16} /> Confirm & Continue</>}
                        </motion.button>

                        <button
                            onClick={() => { onClose(); navigate('/onboarding'); }}
                            className="w-full text-center text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors"
                        >
                            Complete full onboarding instead →
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
