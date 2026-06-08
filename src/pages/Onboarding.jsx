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
    { id: 'profile_setup', label: 'Profile', icon: Camera },
    { id: 'kyc_upload', label: 'Verify ID', icon: ShieldCheck },
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

    // Step C
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(userData?.photoURL || currentUser?.photoURL || '');
    const [bio, setBio] = useState(userData?.bio || '');
    const [userRole, setUserRoleLocal] = useState(userData?.userRole || 'tenant');
    const photoRef = useRef();

    // Step D
    const [docType, setDocType] = useState('nid');
    const [docFile, setDocFile] = useState(null);
    const [docFileName, setDocFileName] = useState('');
    const docRef = useRef();

    // If already completed, send them home
    if (savedStep === 'completed' && initialStepIdx === STEPS.length) {
        navigate(nextRoute, { replace: true });
        return null;
    }

    const currentStep = STEPS[stepIdx];
    const progress = ((stepIdx) / STEPS.length) * 100;

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
                onboardingStep: 'profile_setup',
            });
            goNext();
        } catch { setError('Failed to save. Please try again.'); }
        finally { setSaving(false); }
    }

    /* ── Skip Phone ────────────────────────────────────────────────────── */
    async function skipPhone() {
        setSaving(true);
        try {
            await updateUserProfile({ onboardingStep: 'profile_setup' });
            goNext();
        } catch { setError('Something went wrong.'); }
        finally { setSaving(false); }
    }

    /* ── STEP C: Profile Photo, Bio, Role ─────────────────────────────── */
    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }

    async function submitProfile() {
        setSaving(true);
        try {
            let photoURL = userData?.photoURL || currentUser?.photoURL || '';
            if (photoFile) {
                const compressed = await compressImage(photoFile);
                const storageRef = ref(storage, `profilePhotos/${currentUser.uid}/avatar.jpg`);
                await uploadBytes(storageRef, compressed);
                photoURL = await getDownloadURL(storageRef);
            }
            await updateUserProfile({
                photoURL,
                bio: bio.trim(),
                userRole,
                onboardingStep: 'kyc_upload',
            });
            goNext();
        } catch { setError('Failed to upload photo. Please try again.'); }
        finally { setSaving(false); }
    }

    /* ── Skip Profile ──────────────────────────────────────────────────── */
    async function skipProfile() {
        setSaving(true);
        try {
            await updateUserProfile({ onboardingStep: 'kyc_upload' });
            goNext();
        } catch { setError('Something went wrong.'); }
        finally { setSaving(false); }
    }

    /* ── STEP D: KYC Document Upload ───────────────────────────────────── */
    function handleDocChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setDocFile(file);
        setDocFileName(file.name);
    }

    async function submitKyc() {
        if (!docFile) { setError('Please upload your ID document.'); return; }
        setSaving(true);
        try {
            const storageRef = ref(storage, `kycDocuments/${currentUser.uid}/${docType}_${Date.now()}`);
            await uploadBytes(storageRef, docFile);
            const idDocumentUrl = await getDownloadURL(storageRef);
            await updateUserProfile({
                'verification.idDocumentUrl': idDocumentUrl,
                'verification.isKycApproved': false,
                'verification.submittedAt': new Date().toISOString(),
                'verification.docType': docType,
                onboardingStep: 'completed',
                onboardingStatus: 'PENDING_VERIFICATION',
            });
            goNext(); // → completion screen
        } catch { setError('Failed to upload document. Please try again.'); }
        finally { setSaving(false); }
    }

    /* ── Skip KYC (can do later) ───────────────────────────────────────── */
    async function skipKyc() {
        setSaving(true);
        try {
            await updateUserProfile({ onboardingStep: 'completed', onboardingStatus: 'COMPLETED' });
            navigate(nextRoute, { replace: true });
        } catch { setError('Something went wrong.'); }
        finally { setSaving(false); }
    }

    /* ─────────────────────────────────────────────────────────────────────
       COMPLETION SCREEN
    ───────────────────────────────────────────────────────────────────── */
    if (stepIdx >= STEPS.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1a227f] via-[#1a3a7f] to-[#0d1b4b] flex flex-col items-center justify-center p-6 text-center">
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
                    <p className="text-white/60 font-medium text-sm max-w-xs mx-auto mb-2">
                        Your profile is complete. Your ID is under review — this usually takes 24 hours.
                    </p>
                    <p className="text-white/40 text-xs font-medium mb-10">
                        You can browse and save listings while we verify your identity.
                    </p>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(nextRoute, { replace: true })}
                        className="px-10 py-4 bg-white text-[#1a227f] font-black rounded-2xl shadow-2xl text-sm uppercase tracking-widest"
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
                            <div className="size-8 bg-[#1a227f] rounded-xl flex items-center justify-center">
                                <HomeIcon size={16} className="text-white" />
                            </div>
                            <span className="text-sm font-black text-[#1a227f] dark:text-indigo-400 uppercase tracking-tighter">AnyLet</span>
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
                                    <div className={`w-full h-1 rounded-full transition-all duration-500 ${done || active ? 'bg-[#1a227f]' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    <div className={`size-7 rounded-xl flex items-center justify-center transition-all ${done ? 'bg-[#1a227f] text-white' : active ? 'bg-[#1a227f]/10 text-[#1a227f] dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-transparent text-slate-300 dark:text-slate-600'}`}>
                                        {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:block ${active ? 'text-[#1a227f] dark:text-indigo-400' : done ? 'text-slate-500' : 'text-slate-300 dark:text-slate-600'}`}>{s.label}</span>
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
                                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:border-[#1a227f] focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Last Name</label>
                                        <input
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            placeholder="Last Name"
                                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:border-[#1a227f] focus:outline-none transition-colors"
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
                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:border-[#1a227f] focus:outline-none transition-colors"
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
                                    <div className="flex gap-2">
                                        <div className="flex items-center px-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-500 text-sm whitespace-nowrap">
                                            🇧🇩 +880
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                                            placeholder="01712 345 678"
                                            className="flex-1 px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:border-[#1a227f] focus:outline-none transition-colors"
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
                                        <ContinueButton onClick={submitPhone} loading={saving} className="flex-1" />
                                    </div>
                                    <button onClick={skipPhone} className="text-center text-xs text-slate-400 font-bold underline underline-offset-2 hover:text-slate-600 transition-colors">
                                        Skip for now
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP C ─────────────────────────────────────────────── */}
                        {currentStep.id === 'profile_setup' && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Your profile</h1>
                                    <p className="text-sm font-medium text-slate-500">A face and bio builds trust. Hosts are 4x more likely to respond to complete profiles.</p>
                                </div>
                                {/* Photo */}
                                <div className="flex flex-col items-center gap-3">
                                    <button
                                        onClick={() => photoRef.current?.click()}
                                        className="relative size-28 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-dashed border-slate-300 dark:border-slate-600 hover:border-[#1a227f] transition-colors group"
                                    >
                                        {photoPreview
                                            ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            : <div className="flex flex-col items-center justify-center h-full gap-1"><Camera size={28} className="text-slate-400" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Add Photo</span></div>
                                        }
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={24} className="text-white" />
                                        </div>
                                    </button>
                                    <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                    <span className="text-xs text-slate-400 font-medium">Tap to upload · Auto-compressed</span>
                                </div>
                                {/* Bio */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Short Bio <span className="text-slate-400 font-medium">(optional)</span></label>
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        maxLength={200}
                                        rows={3}
                                        placeholder="Tell hosts a bit about yourself — occupation, lifestyle, why you're moving..."
                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-medium text-sm text-slate-900 dark:text-white focus:border-[#1a227f] focus:outline-none resize-none transition-colors"
                                    />
                                    <p className="text-right text-xs text-slate-400 mt-1">{bio.length}/200</p>
                                </div>
                                {/* Role */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 block">I am primarily...</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { val: 'tenant', label: 'Looking to Rent', icon: Users },
                                            { val: 'host', label: 'Listing a Property', icon: Building2 },
                                            { val: 'dual', label: 'Both', icon: HomeIcon },
                                        ].map(({ val, label, icon: Icon }) => (
                                            <button
                                                key={val}
                                                onClick={() => setUserRoleLocal(val)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${userRole === val ? 'border-[#1a227f] bg-[#1a227f]/5 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
                                            >
                                                <Icon size={20} className={userRole === val ? 'text-[#1a227f] dark:text-indigo-400' : 'text-slate-400'} />
                                                <span className={`text-[10px] font-black text-center uppercase tracking-wider leading-tight ${userRole === val ? 'text-[#1a227f] dark:text-indigo-400' : 'text-slate-500'}`}>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {error && <ErrorBanner message={error} />}
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <button onClick={goBack} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><ArrowLeft size={20} /></button>
                                        <ContinueButton onClick={submitProfile} loading={saving} className="flex-1" />
                                    </div>
                                    <button onClick={skipProfile} className="text-center text-xs text-slate-400 font-bold underline underline-offset-2 hover:text-slate-600 transition-colors">
                                        Skip for now
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP D ─────────────────────────────────────────────── */}
                        {currentStep.id === 'kyc_upload' && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Verify your identity</h1>
                                    <p className="text-sm font-medium text-slate-500">Securely uploaded. Only reviewed by our trust team. Never shared publicly.</p>
                                </div>
                                {/* Doc type */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 block">Document Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { val: 'nid', label: 'National ID' },
                                            { val: 'passport', label: 'Passport' },
                                            { val: 'license', label: 'Driving License' },
                                        ].map(({ val, label }) => (
                                            <button
                                                key={val}
                                                onClick={() => setDocType(val)}
                                                className={`py-3 px-2 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition-all ${docType === val ? 'border-[#1a227f] bg-[#1a227f]/5 text-[#1a227f] dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 bg-white dark:bg-slate-800'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Upload */}
                                <button
                                    onClick={() => docRef.current?.click()}
                                    className={`flex flex-col items-center justify-center gap-3 w-full py-10 rounded-3xl border-2 border-dashed transition-all ${docFile ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-[#1a227f]'}`}
                                >
                                    {docFile
                                        ? <><FileCheck size={32} className="text-emerald-500" /><span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{docFileName}</span><span className="text-xs text-emerald-500 font-medium">Tap to change</span></>
                                        : <><Upload size={32} className="text-slate-400" /><span className="text-sm font-black text-slate-600 dark:text-slate-300">Tap to upload document</span><span className="text-xs text-slate-400 font-medium">JPG, PNG or PDF · Max 10MB</span></>
                                    }
                                </button>
                                <input ref={docRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocChange} />
                                {/* Privacy note */}
                                <div className="flex items-start gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                    <ShieldCheck size={16} className="text-[#1a227f] dark:text-indigo-400 mt-0.5 shrink-0" />
                                    <p className="text-xs font-medium text-slate-500">Your document is stored in an encrypted, private bucket. It is never visible to other users or hosts.</p>
                                </div>
                                {error && <ErrorBanner message={error} />}
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <button onClick={goBack} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><ArrowLeft size={20} /></button>
                                        <ContinueButton onClick={submitKyc} loading={saving} label="Submit & Finish" className="flex-1" />
                                    </div>
                                    <button onClick={skipKyc} className="text-center text-xs text-slate-400 font-bold underline underline-offset-2 hover:text-slate-600 transition-colors">
                                        Skip for now — I'll verify later
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
            className={`flex items-center justify-center gap-2 py-4 px-8 bg-[#1a227f] text-white font-black rounded-2xl shadow-lg shadow-[#1a227f]/20 hover:bg-[#1a227f]/90 transition-all disabled:opacity-70 ${className}`}
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
