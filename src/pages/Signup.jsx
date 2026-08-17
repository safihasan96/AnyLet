import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { generateReferralCode, clearStoredReferralCode } from '../utils/referral';
import logger from '../utils/logger';
import AuthShell, { AuthDivider, AuthAlert } from '../components/auth/AuthShell';
import GoogleButton from '../components/auth/GoogleButton';
import { Field, Input, Button, Checkbox, Card, Badge, Spinner, Icon } from '../components/ui';

const REF_STATUS = { IDLE: 'idle', CHECKING: 'checking', VALID: 'valid', INVALID: 'invalid' };

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [referrerBannerName, setReferrerBannerName] = useState('');
  const [referralOpen, setReferralOpen] = useState(false);
  const [manualRefCode, setManualRefCode] = useState('');
  const [refStatus, setRefStatus] = useState(REF_STATUS.IDLE);
  const [refName, setRefName] = useState('');
  const [refDebounce, setRefDebounce] = useState(null);

  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlRefCode = searchParams.get('ref') || '';

  useEffect(() => {
    if (!urlRefCode) return;
    const lookupRef = async () => {
      const snap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', urlRefCode)));
      if (!snap.empty) setReferrerBannerName(snap.docs[0].data().fullName || snap.docs[0].data().displayName || 'a friend');
    };
    lookupRef().catch(logger.error);
  }, [urlRefCode]);

  useEffect(() => {
    if (!manualRefCode.trim() || urlRefCode) {
      setRefStatus(REF_STATUS.IDLE);
      setRefName('');
      return;
    }
    if (refDebounce) clearTimeout(refDebounce);
    setRefStatus(REF_STATUS.CHECKING);
    const timer = setTimeout(async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', manualRefCode.trim().toLowerCase())));
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setRefName(data.fullName || data.displayName || data.personalDetails?.firstName || 'a friend');
          setRefStatus(REF_STATUS.VALID);
        } else {
          setRefStatus(REF_STATUS.INVALID);
          setRefName('');
        }
      } catch {
        setRefStatus(REF_STATUS.INVALID);
      }
    }, 700);
    setRefDebounce(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualRefCode, urlRefCode]);

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    if (!agreeTerms) {
      setError('You must agree to the Terms and Conditions to sign up.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signup(email, password);
      const user = userCredential.user;
      const myCode = generateReferralCode(email);

      let referrerId = null;
      const codeToUse = urlRefCode || (refStatus === REF_STATUS.VALID ? manualRefCode.trim().toLowerCase() : '');
      if (codeToUse) {
        const snap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', codeToUse)));
        if (!snap.empty && snap.docs[0].id !== user.uid) referrerId = snap.docs[0].id;
      }

      await setDoc(doc(db, 'users', user.uid), {
        email, uid: user.uid, role: 'user', accountStatus: 'active', emailVerified: false,
        createdAt: serverTimestamp(), referralCode: myCode, referralWallet: { available: 0, withdrawn: 0 },
        ...(referrerId ? { referredBy: referrerId } : {}),
        onboardingStep: 'personal_details', onboardingStatus: 'IN_PROGRESS', userRole: 'tenant',
        personalDetails: { firstName: '', lastName: '', dateOfBirth: '', phoneNumber: '', isPhoneVerified: false },
        verification: { idDocumentUrl: '', isKycApproved: false, submittedAt: null },
      });

      if (referrerId) await updateDoc(doc(db, 'users', referrerId), { refereeIds: arrayUnion(user.uid) });

      clearStoredReferralCode();
      await sendEmailVerification(user);
      navigate('/verify-email');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('This email is already registered. Please log in instead.');
      else if (err.code === 'auth/weak-password') setError('Password must be at least 6 characters.');
      else if (err.code === 'auth/invalid-email') setError('Please enter a valid email address.');
      else setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup(e) {
    if (e) e.preventDefault();
    setError('');
    const codeToUse = urlRefCode || (refStatus === REF_STATUS.VALID ? manualRefCode.trim().toLowerCase() : '');
    try {
      await signInWithGoogle(codeToUse);
      setGoogleLoading(true);
      navigate('/onboarding');
    } catch (err) {
      if (err.code === 'auth/unauthorized-domain') setError('Google Sign-In failed: this domain is not authorized in Firebase Console.');
      else if (err.code === 'auth/popup-blocked') setError('Popup blocked. Please allow popups and try again.');
      else if (err.code !== 'auth/popup-closed-by-user') {
        logger.error('Google Auth Error:', err);
        setError(`Google sign-up failed: ${err.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  // Route the single error to the right field / general alert.
  const emailError = /already registered|valid email/.test(error) ? error : '';
  const passwordError = /6 characters/.test(error) ? error : '';
  const termsError = /agree to the Terms/.test(error) ? error : '';
  const generalError = !emailError && !passwordError && !termsError ? error : '';

  const refRightIcon =
    refStatus === REF_STATUS.CHECKING ? <Spinner size="sm" className="text-subtle" />
    : refStatus === REF_STATUS.VALID ? <Icon name="success" className="text-success" />
    : refStatus === REF_STATUS.INVALID ? <Icon name="error" className="text-danger" />
    : null;

  return (
    <AuthShell
      title="Create account"
      subtitle="Start your property journey today."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link></>}
    >
      {referrerBannerName && (
        <Card padding="md" className="mb-4 flex items-center gap-3 border-primary-border bg-primary-subtle">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-primary text-on-primary"><Icon name="referral" className="size-4" /></span>
          <p className="text-body-sm text-content"><span className="font-semibold capitalize">{referrerBannerName}</span> invited you to AnyLet.</p>
        </Card>
      )}

      <AuthAlert>{generalError}</AuthAlert>

      <GoogleButton onClick={handleGoogleSignup} loading={googleLoading} disabled={loading}>Sign up with Google</GoogleButton>
      <AuthDivider />

      <form onSubmit={handleSignup} className="space-y-4">
        <Field label="Email address" error={emailError}>
          <Input type="email" name="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Icon name="email" />} required />
        </Field>
        <Field label="Password" error={passwordError} hint="At least 6 characters.">
          <Input type="password" name="password" autoComplete="new-password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<Icon name="locked" />} required />
        </Field>

        {/* Referral (collapsible) */}
        {!urlRefCode && (
          <Card padding="none" className="overflow-hidden">
            <Button
              type="button" variant="ghost" onClick={() => setReferralOpen((o) => !o)}
              className="h-auto w-full justify-between rounded-none px-4 py-3 text-content"
              aria-expanded={referralOpen}
              leftIcon={<Icon name="referral" className="text-primary" />}
              rightIcon={<Icon name="chevronDown" className={referralOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />}
            >
              <span className="flex-1 text-left text-body-sm font-medium">Have a referral code?</span>
              {refStatus === REF_STATUS.VALID && <Badge tone="success" size="sm">Applied</Badge>}
            </Button>
            {referralOpen && (
              <div className="space-y-3 border-t border-border p-4">
                <p className="text-caption text-muted">Enter your referrer’s code to give them a 2% commission on your future payments — at no cost to you.</p>
                <Field
                  error={refStatus === REF_STATUS.INVALID && manualRefCode.length > 2 ? 'Code not found. Check for typos and try again.' : ''}
                >
                  <Input
                    type="text" placeholder="e.g. john-doe-a3f9" value={manualRefCode}
                    onChange={(e) => setManualRefCode(e.target.value)} autoComplete="off" spellCheck={false}
                    leftIcon={<Icon name="referral" />} rightIcon={refRightIcon}
                    invalid={refStatus === REF_STATUS.INVALID && manualRefCode.length > 2}
                  />
                </Field>
                {refStatus === REF_STATUS.VALID && (
                  <p className="inline-flex items-center gap-1.5 text-caption font-medium text-success">
                    <Icon name="success" className="size-3.5" /> Referred by <span className="capitalize">{refName}</span> — code applied.
                  </p>
                )}
              </div>
            )}
          </Card>
        )}

        <div>
          <Checkbox
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            label={<>I agree to AnyLet’s <Link to="/terms" className="font-medium text-primary hover:underline">Terms</Link> and <Link to="/privacy-policy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.</>}
          />
          {termsError && <p role="alert" className="mt-1.5 text-caption text-danger">{termsError}</p>}
        </div>

        <Button type="submit" size="lg" fullWidth loading={loading} rightIcon={<Icon name="forward" />}>Create account</Button>
      </form>
    </AuthShell>
  );
}
