import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    User, Phone, Camera, ShieldCheck, ArrowRight, ArrowLeft,
    CheckCircle2, Home as HomeIcon, Building2, Users,
    Loader2, Upload, FileCheck, AlertCircle, X
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   Utilities
───────────────────────────────────────────────────────────────────────── */
// Bangladesh phone regex: +880XXXXXXXXXX or 01XXXXXXXXX
const BD_PHONE_RE = /^(?:\+880|0)1[3-9]\d{8}$/;
// General international phone regex fallback
const INTL_PHONE_RE = /^\+?[1-9]\d{6,14}$/;

function isValidPhone(num) {
    const clean = num.replace(/\s|-/g, '');
    return BD_PHONE_RE.test(clean) || INTL_PHONE_RE.test(clean);
}

function isAdult(dob) {
    if (!dob) return false;
    const birth = new Date(dob);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear() -
        (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    return age >= 18;
}

// Compress image client-side before upload (simple canvas resize)
async function compressImage(file, maxSizePx = 800) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxSizePx / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(resolve, 'image/jpeg', 0.82);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/* ─────────────────────────────────────────────────────────────────────────
   Animations
───────────────────────────────────────────────────────────────────────── */
const slide = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

const STEPS = [
    { id: 'personal_details', label: 'Personal', icon: User },
    { id: 'phone_verification', label: 'Phone', icon: Phone },
];

/* ─────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────── */
export default function Onboarding() {
    const { currentUser, userData, updateUserProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const nextRoute = searchParams.get('next') || '/';

    // Determine starting step from existing onboarding progress
    const stepIds = STEPS.map(s => s.id);
    const savedStep = userData?.onboardingStep;
    const initialStepIdx = savedStep === 'completed'
        ? STEPS.length
        : Math.max(0, stepIds.indexOf(savedStep));

    const [stepIdx, setStepIdx] = useState(initialStepIdx);
    const [dir, setDir] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Step A
    const [firstName, setFirstName] = useState(userData?.personalDetails?.firstName || '');
    const [lastName, setLastName] = useState(userData?.personalDetails?.lastName || '');
    const [dob, setDob] = useState(userData?.personalDetails?.dateOfBirth || '');

    // Step B
    const [phone, setPhone] = useState(userData?.personalDetails?.phoneNumber || '');
    const [phoneError, setPhoneError] = useState('');

    // If already completed, send them home
    if (savedStep === 'completed' && initialStepIdx === STEPS.length) {
        navigate(nextRoute, { replace: true });
        return null;
    }

    const currentStep = STEPS[stepIdx];

    function goNext() { setDir(1); setStepIdx(s => s + 1); setError(''); }
    function goBack() { setDir(-1); setStepIdx(s => Math.max(0, s - 1)); setError(''); }

    /* ── STEP A: Personal Details ──────────────────────────────────────── */
    async function submitPersonal() {
        if (!firstName.trim() || !lastName.trim()) { setError('Please enter your full name.'); return; }
        if (!dob) { setError('Please enter your date of birth.'); return; }
        if (!isAdult(dob)) { setError('You must be at least 18 years old to use AnyLet.'); return; }
        setSaving(true);
        try {
            await updateUserProfile({
                fullName: `${firstName.trim()} ${lastName.trim()}`,
                'personalDetails.firstName': firstName.trim(),
                'personalDetails.lastName': lastName.trim(),
                'personalDetails.dateOfBirth': dob,
                onboardingStep: 'phone_verification',
            });
            goNext();
        } catch { setError('Failed to save. Please try again.'); }
        finally { setSaving(false); }
    }

    /* ── STEP B: Phone Number (validated, no OTP) ──────────────────────── */
    async function submitPhone() {
        const clean = phone.replace(/\s|-/g, '');
        if (!clean) { setPhoneError('Please enter your phone number.'); return; }
        if (!isValidPhone(clean)) {
            setPhoneError('Enter a valid BD number (e.g. 01712345678) or international number with country code.');
            return;
        }
        setSaving(true);
        try {
            await updateUserProfile({
                'personalDetails.phoneNumber': clean,
                'personalDetails.isPhoneVerified': true,
                onboardingStep: 'completed',
                onboardingStatus: 'COMPLETED',
            });
            navigate(nextRoute, { replace: true });
        } catch { setError('Failed to save. Please try again.'); }
        finally { setSaving(false); }
    }

    /* ── Skip Phone ────────────────────────────────────────────────────── */
    async function skipPhone() {
        setSaving(true);
        try {
            await updateUserProfile({ 
                onboardingStep: 'completed',
                onboardingStatus: 'COMPLETED',
            });
            navigate(nextRoute, { replace: true });
        } catch { setError('Something went wrong.'); }
        finally { setSaving(false); }
    }

    /* ─────────────────────────────────────────────────────────────────────
       COMPLETION SCREEN
    ───────────────────────────────────────────────────────────────────── */
    if (stepIdx >= STEPS.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-800 to-indigo-950 flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="size-28 rounded-[32px] bg-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-400/30 mb-8"
                >
                    <CheckCircle2 size={56} className="text-white" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h1 className="text-3xl font-black text-white mb-3">You're all set! 🎉</h1>
                    <p className="text-white/60 font-medium text-sm max-w-xs mx-auto mb-10">
                        Your profile is complete. You can now explore and add properties on AnyLet.
                    </p>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(nextRoute, { replace: true })}
                        className="px-10 py-4 bg-white text-primary font-black rounded-2xl shadow-2xl text-sm uppercase tracking-widest hover:bg-slate-50 transition-colors"
                    >
                        Start Exploring
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    /* ─────────────────────────────────────────────────────────────────────
       WIZARD SHELL
    ───────────────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 pt-4 pb-0">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="size-8 bg-primary rounded-xl flex items-center justify-center">
                                <HomeIcon size={16} className="text-white" />
                            </div>
                            <span className="text-sm font-black text-primary dark:text-indigo-400 uppercase tracking-tighter">AnyLet</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Step {stepIdx + 1} of {STEPS.length}
                        </span>
                    </div>
                    {/* Step pills */}
                    <div className="flex items-center gap-1 mb-0">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const done = i < stepIdx;
                            const active = i === stepIdx;
                            return (
                                <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                                    <div className={`w-full h-1 rounded-full transition-all duration-500 ${done || active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    <div className={`size-7 rounded-xl flex items-center justify-center transition-all ${done ? 'bg-primary text-white' : active ? 'bg-primary/10 text-primary dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-transparent text-slate-300 dark:text-slate-600'}`}>
                                        {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:block ${active ? 'text-primary dark:text-indigo-400' : done ? 'text-slate-500' : 'text-slate-300 dark:text-slate-600'}`}>{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8">
                <AnimatePresence custom={dir} mode="wait">
                    <motion.div
                        key={currentStep.id}
                        custom={dir}
                        variants={slide}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="flex-1"
                    >
                        {/* ── STEP A ─────────────────────────────────────────────── */}
                        {currentStep.id === 'personal_details' && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Your legal name</h1>
                                    <p className="text-sm font-medium text-slate-500">As it appears on your government ID. Required for lease agreements.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">First Name</label>
                                        <input
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            placeholder="First Name"
                                            className="w-full px-4 py-3.5 bg-white dark:bg-[#0A0C10] border-2 border-slate-200 dark:border-transparent rounded-2xl font-bold text-slate-900 dark:text-white focus:border-primary/50 dark:focus:border-indigo-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Last Name</label>
                                        <input
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            placeholder="Last Name"
                                            className="w-full px-4 py-3.5 bg-white dark:bg-[#0A0C10] border-2 border-slate-200 dark:border-transparent rounded-2xl font-bold text-slate-900 dark:text-white focus:border-primary/50 dark:focus:border-indigo-500/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Date of Birth <span className="text-rose-500">· Must be 18+</span></label>
                                    <input
                                        type="date"
                                        value={dob}
                                        onChange={e => setDob(e.target.value)}
                                        max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                                        className="w-full px-4 py-3.5 bg-white dark:bg-[#0A0C10] border-2 border-slate-200 dark:border-transparent rounded-2xl font-bold text-slate-900 dark:text-white focus:border-primary/50 dark:focus:border-indigo-500/50 outline-none transition-all"
                                    />
                                </div>
                                {error && <ErrorBanner message={error} />}
                                <ContinueButton onClick={submitPersonal} loading={saving} />
                            </div>
                        )}

                        {/* ── STEP B ─────────────────────────────────────────────── */}
                        {currentStep.id === 'phone_verification' && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Your phone number</h1>
                                    <p className="text-sm font-medium text-slate-500">Used for host-tenant contact and important account alerts.</p>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                                    <div className="flex gap-2 group">
                                        <div className="flex items-center px-4 bg-white dark:bg-[#0A0C10] border-2 border-slate-200 dark:border-transparent rounded-2xl font-bold text-slate-500 text-sm whitespace-nowrap transition-colors group-focus-within:border-primary/50 dark:group-focus-within:border-indigo-500/50">
                                            🇧🇩 +880
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                                            placeholder="01712 345 678"
                                            className="flex-1 px-4 py-3.5 bg-white dark:bg-[#0A0C10] border-2 border-slate-200 dark:border-transparent rounded-2xl font-bold text-slate-900 dark:text-white focus:border-primary/50 dark:focus:border-indigo-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    {phoneError && (
                                        <p className="flex items-center gap-1.5 mt-2 text-xs font-bold text-rose-500">
                                            <AlertCircle size={12} /> {phoneError}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-slate-400 font-medium">Enter a BD number (01XXXXXXXXX) or international number with country code</p>
                                </div>
                                {error && <ErrorBanner message={error} />}
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <button onClick={goBack} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><ArrowLeft size={20} /></button>
                                        <ContinueButton onClick={submitPhone} loading={saving} className="flex-1" label="Submit & Finish" />
                                    </div>
                                    <button onClick={skipPhone} className="text-center text-xs text-slate-400 font-bold underline underline-offset-2 hover:text-slate-600 transition-colors">
                                        Skip for now
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Shared sub-components
───────────────────────────────────────────────────────────────────────── */
function ContinueButton({ onClick, loading, label = 'Continue', className = '' }) {
    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            disabled={loading}
            className={`flex items-center justify-center gap-2 py-4 px-8 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-70 ${className}`}
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>{label} <ArrowRight size={18} /></>}
        </motion.button>
    );
}

function ErrorBanner({ message }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold">
            <AlertCircle size={14} className="shrink-0" /> {message}
        </div>
    );
}
