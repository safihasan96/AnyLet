import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input, Field, Icon, ErrorState } from '../components/ui';

/* ─────────────────────────────────────────────────────────────────────────
   Utilities
───────────────────────────────────────────────────────────────────────── */
const BD_PHONE_RE = /^(?:\+880|0)1[3-9]\d{8}$/;
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

/* ─────────────────────────────────────────────────────────────────────────
   Animations
───────────────────────────────────────────────────────────────────────── */
const slide = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

const STEPS = [
    { id: 'personal_details', label: 'Personal', iconName: 'user' },
    { id: 'phone_verification', label: 'Phone', iconName: 'phone' },
];

/* ─────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────── */
export default function Onboarding() {
    const { userData, updateUserProfile } = useAuth();
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
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="size-28 rounded-modal bg-success/20 flex items-center justify-center mb-8 border border-success/30"
                >
                    <Icon name="success" className="text-success size-14" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h1 className="text-title-xl text-content mb-3">You're all set! 🎉</h1>
                    <p className="text-muted text-body-md max-w-xs mx-auto mb-10">
                        Your profile is complete. You can now explore and add properties on AnyLet.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => navigate(nextRoute, { replace: true })}
                        className="px-10"
                    >
                        Start Exploring
                    </Button>
                </motion.div>
            </div>
        );
    }

    /* ─────────────────────────────────────────────────────────────────────
       WIZARD SHELL
    ───────────────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-surface-sunken flex flex-col">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 pt-4 pb-0">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="size-8 bg-primary rounded-control flex items-center justify-center">
                                <Icon name="home" className="text-on-primary size-4" />
                            </div>
                            <span className="text-caption font-semibold text-primary uppercase">AnyLet</span>
                        </div>
                        <span className="text-caption text-muted uppercase">
                            Step {stepIdx + 1} of {STEPS.length}
                        </span>
                    </div>
                    {/* Step pills */}
                    <div className="flex items-center gap-1 mb-0">
                        {STEPS.map((s, i) => {
                            const done = i < stepIdx;
                            const active = i === stepIdx;
                            return (
                                <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                                    <div className={`w-full h-1 rounded-full transition-all duration-500 ${done || active ? 'bg-primary' : 'bg-surface-raised border border-border'}`} />
                                    <div className={`size-7 rounded-control flex items-center justify-center transition-all ${done ? 'bg-primary text-on-primary' : active ? 'bg-primary-subtle text-primary' : 'text-subtle'}`}>
                                        {done ? <Icon name="success" className="size-3.5" /> : <Icon name={s.iconName} className="size-3.5" />}
                                    </div>
                                    <span className={`text-[9px] font-semibold uppercase tracking-wider hidden sm:block ${active ? 'text-primary' : done ? 'text-content' : 'text-subtle'}`}>{s.label}</span>
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
                                    <h1 className="text-title-lg text-content mb-1">Your legal name</h1>
                                    <p className="text-body-sm text-muted">As it appears on your government ID. Required for lease agreements.</p>
                                </div>
                                <Card padding="lg" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="First Name">
                                            <Input
                                                value={firstName}
                                                onChange={e => setFirstName(e.target.value)}
                                                placeholder="First Name"
                                            />
                                        </Field>
                                        <Field label="Last Name">
                                            <Input
                                                value={lastName}
                                                onChange={e => setLastName(e.target.value)}
                                                placeholder="Last Name"
                                            />
                                        </Field>
                                    </div>
                                    <Field label={<>Date of Birth <span className="text-danger font-normal ml-1">· Must be 18+</span></>}>
                                        <Input
                                            type="date"
                                            value={dob}
                                            onChange={e => setDob(e.target.value)}
                                            max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                                        />
                                    </Field>
                                </Card>
                                {error && <ErrorState message={error} />}
                                <Button size="lg" onClick={submitPersonal} loading={saving} rightIcon={<Icon name="forward" />}>
                                    Continue
                                </Button>
                            </div>
                        )}

                        {/* ── STEP B ─────────────────────────────────────────────── */}
                        {currentStep.id === 'phone_verification' && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h1 className="text-title-lg text-content mb-1">Your phone number</h1>
                                    <p className="text-body-sm text-muted">Used for host-tenant contact and important account alerts.</p>
                                </div>
                                <Card padding="lg">
                                    <Field label="Phone Number" error={phoneError} hint="Enter a BD number (01XXXXXXXXX) or international number with country code">
                                        <div className="flex gap-2">
                                            <div className="flex items-center px-4 bg-surface-sunken border border-border rounded-control font-semibold text-muted text-sm whitespace-nowrap">
                                                🇧🇩 +880
                                            </div>
                                            <Input
                                                type="tel"
                                                value={phone}
                                                onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                                                placeholder="01712 345 678"
                                                className="flex-1"
                                                invalid={!!phoneError}
                                            />
                                        </div>
                                    </Field>
                                </Card>
                                {error && <ErrorState message={error} />}
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <Button variant="outline" size="lg" onClick={goBack}><Icon name="back" /></Button>
                                        <Button size="lg" className="flex-1" onClick={submitPhone} loading={saving} rightIcon={<Icon name="success" />}>
                                            Submit & Finish
                                        </Button>
                                    </div>
                                    <Button variant="ghost" onClick={skipPhone} className="text-muted">
                                        Skip for now
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
