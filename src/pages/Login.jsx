import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { signOut, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import logger from '../utils/logger';
import AuthShell, { AuthDivider, AuthAlert } from '../components/auth/AuthShell';
import GoogleButton from '../components/auth/GoogleButton';
import { Field, Input, Button, Icon } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [linkPending, setLinkPending] = useState(null);
  const [linkPassword, setLinkPassword] = useState('');

  const { login, signInWithGoogle, linkGoogleAfterPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextRoute = searchParams.get('next') || '/';

  function getRedirect(role) {
    if (role === 'admin') return '/admin';
    return nextRoute;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setResent(false);
    try {
      setLoading(true);
      const userCredential = await login(email, password);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setUnverified(true);
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, 'users', userCredential.user.uid));
      const data = snap.exists() ? snap.data() : {};
      navigate(getRedirect(data.role), { replace: true });
    } catch {
      setError('Incorrect email or password. Please try again.');
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(e) {
    if (e) e.preventDefault();
    setError('');
    try {
      const result = await signInWithGoogle();
      setGoogleLoading(true);
      const snap = await getDoc(doc(db, 'users', result.user.uid));
      const data = snap.exists() ? snap.data() : {};
      navigate(getRedirect(data.role), { replace: true });
    } catch (err) {
      if (err.code === 'auth/link-required') {
        setLinkPending({ email: err.email, pendingCredential: err.pendingCredential });
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Google Sign-In failed: this domain is not authorized in Firebase Console.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google Sign-In failed: your browser blocked the popup. Please allow popups and retry.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        logger.error('Google Auth Error:', err);
        setError(`Google sign-in failed: ${err.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLinkSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await linkGoogleAfterPassword(linkPassword, linkPending.email, linkPending.pendingCredential);
      const snap = await getDoc(doc(db, 'users', result.user.uid));
      const data = snap.exists() ? snap.data() : {};
      navigate(getRedirect(data.role), { replace: true });
    } catch {
      setError('Wrong password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setResending(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setResent(true);
    } catch {
      setError('Could not resend email. Please check your credentials.');
    } finally {
      setResending(false);
    }
  }

  // ── Account-linking screen ─────────────────────────────────────────────────
  if (linkPending) {
    return (
      <AuthShell
        title="Link your accounts"
        subtitle={`You already have an account with ${linkPending.email} using a password. Enter it to link Google sign-in.`}
        onBack={() => setLinkPending(null)}
      >
        <AuthAlert>{error}</AuthAlert>
        <form onSubmit={handleLinkSubmit} className="space-y-4">
          <Field label="Existing password">
            <Input type="password" autoComplete="current-password" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} leftIcon={<Icon name="locked" />} required />
          </Field>
          <Button type="submit" size="lg" fullWidth loading={loading} rightIcon={<Icon name="forward" />}>Link &amp; continue</Button>
        </form>
      </AuthShell>
    );
  }

  // ── Main login ─────────────────────────────────────────────────────────────
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your rentals."
      footer={<>Don’t have an account? <Link to="/signup" className="font-semibold text-primary hover:underline">Create one</Link></>}
    >
      <AuthAlert>{error}</AuthAlert>

      {unverified && (
        <div className="mb-4 rounded-card bg-warning-subtle p-4">
          <p className="text-body-sm text-content">Your email isn’t verified yet. Please check your inbox.</p>
          {resent ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-body-sm font-medium text-success"><Icon name="success" className="size-4" /> Verification email resent</p>
          ) : (
            <Button variant="ghost" size="sm" className="mt-2 -ml-2 text-warning" loading={resending} onClick={handleResendVerification} leftIcon={<Icon name="refresh" />}>
              Resend verification email
            </Button>
          )}
        </div>
      )}

      <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} disabled={loading} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address">
          <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Icon name="email" />} required />
        </Field>
        <div>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<Icon name="locked" />} required />
          </Field>
          <div className="mt-1.5 text-right">
            <Link to="/forgot-password" className="text-caption font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
        </div>
        <Button type="submit" size="lg" fullWidth loading={loading} rightIcon={<Icon name="forward" />}>Sign in</Button>
      </form>
    </AuthShell>
  );
}
