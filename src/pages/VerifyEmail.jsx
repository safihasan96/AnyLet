import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import logger from '../utils/logger';
import AuthShell from '../components/auth/AuthShell';
import { Card, Button, Icon, useToast } from '../components/ui';

export default function VerifyEmail() {
  const { currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isVerified, setIsVerified] = useState(currentUser?.emailVerified || false);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    if (currentUser.emailVerified) setIsVerified(true);
  }, [currentUser, navigate]);

  const handleResend = async () => {
    try {
      setSending(true);
      await sendEmailVerification(auth.currentUser);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      logger.error(error);
      toast.error('Too many requests. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
      if (auth.currentUser.emailVerified) setIsVerified(true);
      else toast.warning('Email not yet verified. Please check your inbox and click the link.');
    } catch (error) {
      logger.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const signOutToLogin = () => { logout(); navigate('/login'); };

  if (isVerified) {
    return (
      <AuthShell title="Email verified" subtitle="You now have full access to Any-Let." onBack={() => navigate('/')}>
        <Card variant="raised" padding="lg" className="text-center">
          <span className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-success-subtle text-success"><Icon name="success" className="size-8" /></span>
          <p className="text-body-sm text-muted">Your email address has been successfully verified.</p>
        </Card>
        <Button size="lg" fullWidth className="mt-4" onClick={() => navigate('/')}>Go to homepage</Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verify your email" subtitle={`We’ve sent a verification link to ${currentUser?.email || 'your email'}.`} onBack={signOutToLogin}>
      <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary-subtle text-primary"><Icon name="email" className="size-7" /></span>

      <Card padding="md" className="mb-5 flex items-start gap-3 border-warning/30 bg-warning-subtle">
        <Icon name="warning" className="mt-0.5 size-5 shrink-0 text-warning" />
        <div>
          <p className="text-body-sm font-semibold text-content">Check your spam folder</p>
          <p className="mt-0.5 text-caption text-muted">Verification emails sometimes land in Spam or Junk. Look there if you don’t see it in your inbox.</p>
        </div>
      </Card>

      <div className="space-y-3">
        <Button size="lg" fullWidth loading={refreshing} onClick={handleCheckStatus} leftIcon={<Icon name="success" />}>I’ve verified</Button>
        <Button
          variant="secondary" size="lg" fullWidth
          disabled={sent} loading={sending} onClick={handleResend}
          leftIcon={<Icon name={sent ? 'success' : 'refresh'} />}
        >
          {sent ? 'Email sent' : 'Resend verification link'}
        </Button>
      </div>

      <div className="mt-8 border-t border-border pt-6 text-center">
        <Button variant="ghost" size="sm" onClick={signOutToLogin} leftIcon={<Icon name="logout" />}>Sign in with a different account</Button>
      </div>
    </AuthShell>
  );
}
