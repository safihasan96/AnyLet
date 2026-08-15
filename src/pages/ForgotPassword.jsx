import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import logger from '../utils/logger';
import AuthShell from '../components/auth/AuthShell';
import { Field, Input, Button, Icon, Card } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      logger.error(err);
      if (err.code === 'auth/user-not-found') setError('No account found with this email address.');
      else if (err.code === 'auth/invalid-email') setError('Please enter a valid email address.');
      else setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle="Follow the link we sent to reset your password. It expires in 1 hour." onBack={() => navigate('/login')}>
        <Card variant="raised" padding="lg" className="text-center">
          <span className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-success-subtle text-success"><Icon name="success" className="size-8" /></span>
          <p className="text-body-sm text-muted">We’ve sent a password reset link to</p>
          <p className="mt-1 text-title-sm text-primary">{email}</p>
        </Card>
        <div className="mt-4 space-y-2">
          <Button as={Link} to="/login" size="lg" fullWidth leftIcon={<Icon name="back" />}>Back to login</Button>
          <Button variant="ghost" size="sm" fullWidth onClick={() => { setSent(false); setEmail(''); }}>Use a different email</Button>
        </div>
        <p className="mt-6 text-center text-caption text-subtle">Didn’t receive it? Check your spam folder.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your registered email and we’ll send you a secure reset link." onBack={() => navigate(-1)}>
      <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary-subtle text-primary"><Icon name="email" className="size-7" /></span>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address" error={error}>
          <Input type="email" autoComplete="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Icon name="email" />} required />
        </Field>
        <Button type="submit" size="lg" fullWidth loading={loading} rightIcon={<Icon name="forward" />}>Send reset link</Button>
      </form>
      <div className="mt-6 text-center">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-primary hover:underline">
          <Icon name="back" className="size-4" /> Back to login
        </Link>
      </div>
    </AuthShell>
  );
}
