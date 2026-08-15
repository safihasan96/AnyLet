import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useReferral } from '../hooks/useReferral';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { formatBDT } from '../utils/referral';
import { getApiUrl } from '../utils/api';
import Container from '../components/layout/Container';
import Grid from '../components/layout/Grid';
import { Card, Button, Input, Field, IconButton, Icon, Badge, useToast, Spinner } from '../components/ui';

function relativeTime(ts) {
    if (!ts) return '';
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff  = (Date.now() - date.getTime()) / 1000;
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function WithdrawModal({ available, onClose }) {
    const [amount, setAmount]         = useState('');
    const [bankName, setBankName]     = useState('');
    const [accNo, setAccNo]           = useState('');
    const [accName, setAccName]       = useState('');
    const [loading, setLoading]       = useState(false);
    const [success, setSuccess]       = useState(false);
    const toast = useToast();

    const minWithdraw = 100;

    async function submit(e) {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt < minWithdraw) {
            toast.error(`Minimum withdrawal is ${formatBDT(minWithdraw)}`);
            return;
        }
        if (amt > available) {
            toast.error('Amount exceeds your available balance.');
            return;
        }
        setLoading(true);
        try {
            const idToken = await auth.currentUser?.getIdToken(true);
            if (!idToken) throw new Error('Not authenticated');

            const response = await fetch(getApiUrl('/api/request-withdrawal'), {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    amount: amt,
                    bankDetails: { bankName, accountNumber: accNo, accountName: accName },
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Withdrawal failed');
            setSuccess(true);
        } catch (err) {
            toast.error(err.message || 'Withdrawal failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (typeof document === 'undefined') return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 22 }}
                className="w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <Card padding="xl" className="shadow-2xl">
                    {success ? (
                        <div className="py-6 text-center">
                            <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-success-subtle text-success">
                                <Icon name="success" className="size-10" />
                            </div>
                            <h3 className="mb-2 text-title-lg font-display text-content">Request Submitted!</h3>
                            <p className="mb-6 text-body-sm text-muted">
                                Your withdrawal request is under review. We'll process it within 1-3 business days.
                            </p>
                            <Button fullWidth onClick={onClose}>Done</Button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-title-md font-display text-content">Withdraw Earnings</h3>
                                <IconButton variant="ghost" onClick={onClose} label="Close">
                                    <Icon name="close" />
                                </IconButton>
                            </div>

                            <div className="mb-6 flex items-center justify-between rounded-card bg-primary-subtle p-4">
                                <div>
                                    <p className="mb-0.5 text-caption uppercase tracking-wider text-primary">Available Balance</p>
                                    <p className="font-display text-display-sm text-primary">{formatBDT(available)}</p>
                                </div>
                                <Icon name="wallet" className="size-7 text-primary opacity-80" />
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <Field required>
                                    <Input
                                        type="number" min={minWithdraw} max={available}
                                        placeholder={`Amount (min ${formatBDT(minWithdraw)})`}
                                        value={amount} onChange={e => setAmount(e.target.value)}
                                        required
                                    />
                                </Field>
                                <Field required>
                                    <Input
                                        type="text" placeholder="Bank / bKash / Nagad Name"
                                        value={bankName} onChange={e => setBankName(e.target.value)}
                                        required
                                    />
                                </Field>
                                <Field required>
                                    <Input
                                        type="text" placeholder="Account / Mobile Number"
                                        value={accNo} onChange={e => setAccNo(e.target.value)}
                                        required
                                    />
                                </Field>
                                <Field required>
                                    <Input
                                        type="text" placeholder="Account Holder Name"
                                        value={accName} onChange={e => setAccName(e.target.value)}
                                        required
                                    />
                                </Field>
                                <Button
                                    type="submit" fullWidth disabled={loading}
                                    leftIcon={loading ? <Icon name="refresh" className="animate-spin" /> : <Icon name="payments" />}
                                    className="mt-2"
                                >
                                    {loading ? 'Processing...' : 'Request Withdrawal'}
                                </Button>
                            </form>
                        </>
                    )}
                </Card>
            </motion.div>
        </motion.div>,
        document.body
    );
}

function StatCard({ icon, label, value, tone = 'primary' }) {
    const tones = {
        primary: 'bg-primary-subtle text-primary',
        success: 'bg-success-subtle text-success',
        info: 'bg-info-subtle text-info',
    };
    return (
        <Card padding="md" className="flex flex-col gap-3">
            <div className={`grid size-10 place-items-center rounded-control ${tones[tone] || tones.primary}`}>
                <Icon name={icon} className="size-5" />
            </div>
            <div>
                <p className="mb-1 text-caption uppercase tracking-wider text-muted">{label}</p>
                <p className="font-display text-title-lg text-content">{value}</p>
            </div>
        </Card>
    );
}

export default function ReferralDashboard() {
    const { currentUser } = useAuth();

    const {
        referralLink, referralCode,
        referees, commissions,
        totalEarned, availableBalance,
        loading,
    } = useReferral();

    const [copied, setCopied] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    function copyLink() {
        navigator.clipboard.writeText(referralLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }

    function shareLink() {
        if (navigator.share) {
            navigator.share({
                title: 'Join Any.Let',
                text: 'Find & rent properties easily in Bangladesh. Use my link to sign up!',
                url: referralLink,
            }).catch(() => {});
        } else {
            copyLink();
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-bg">
                <Spinner size="lg" className="mb-3 text-primary" />
                <p className="text-body-sm font-medium text-muted">Loading your earnings...</p>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-bg pb-32">
                <header className="sticky top-14 z-10 flex items-center justify-center border-b border-border bg-bg p-6">
                    <h1 className="text-caption font-bold tracking-widest text-primary uppercase">Earn Money</h1>
                </header>

                <Container size="narrow" className="mt-6 space-y-6">
                    {/* Hero Banner */}
                    <div className="relative overflow-hidden rounded-card bg-primary p-7 text-on-primary">
                        <div className="absolute -right-8 -top-8 size-36 rounded-full bg-white/10" />
                        <div className="absolute -right-2 top-12 size-20 rounded-full bg-white/10" />
                        <Icon name="favorite" className="mb-4 size-8 opacity-90" />
                        <h2 className="mb-1 font-display text-display-sm leading-tight">Refer & Earn</h2>
                        <p className="text-body-sm font-medium text-on-primary/80 leading-relaxed">
                            Share your link. Earn a <strong className="text-on-primary">5% lifetime commission</strong> on every purchase your referred friends make.
                        </p>
                    </div>

                    {/* Referral Link Box */}
                    <Card padding="lg" className="space-y-4">
                        <p className="text-caption uppercase tracking-wider text-muted">Your Referral Link</p>

                        <div className="flex items-center gap-2 rounded-control border border-border bg-surface-sunken p-1 pl-4">
                            <p className="flex-1 truncate text-body-sm font-medium text-content">{referralLink}</p>
                            <Button 
                                variant={copied ? 'secondary' : 'primary'} 
                                onClick={copyLink} 
                                className="shrink-0"
                                leftIcon={<Icon name={copied ? 'check' : 'copy'} />}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <p className="text-caption text-muted">Code:</p>
                            <Badge tone="primary" size="md">{referralCode}</Badge>
                            <Button variant="ghost" size="sm" onClick={shareLink} className="ml-auto" leftIcon={<Icon name="externalLink" />}>
                                Share
                            </Button>
                        </div>
                    </Card>

                    {/* Stats Grid */}
                    <Grid cols={3} gap="md">
                        <StatCard icon="user" label="Friends Referred" value={referees.length} tone="info" />
                        <StatCard icon="trending" label="Total Earned" value={formatBDT(totalEarned)} tone="primary" />
                        <StatCard icon="wallet" label="Available" value={formatBDT(availableBalance)} tone="success" />
                    </Grid>

                    {/* Withdraw Button */}
                    <Card as="button" onClick={() => setShowWithdraw(true)} disabled={availableBalance < 100} className="group flex w-full items-center justify-between p-5 text-left transition-colors disabled:opacity-50">
                        <div className="flex items-center gap-4">
                            <div className="grid size-11 place-items-center rounded-control bg-success-subtle text-success">
                                <Icon name="payments" className="size-5" />
                            </div>
                            <div>
                                <p className="font-display text-title-sm text-content">Claim Rewards</p>
                                <p className="text-caption text-muted">{availableBalance < 100 ? 'Min. ৳100 required to withdraw' : `৳${availableBalance.toFixed(2)} ready to withdraw`}</p>
                            </div>
                        </div>
                        <Icon name="chevronRight" className="size-5 text-subtle transition-transform group-hover:translate-x-1" />
                    </Card>

                    {/* Commission History */}
                    {commissions.length > 0 && (
                        <Card padding="none" className="overflow-hidden">
                            <div className="p-5 pb-3">
                                <p className="text-caption uppercase tracking-wider text-muted">Commission History</p>
                            </div>
                            <div className="divide-y divide-border">
                                {commissions.slice(0, 10).map(c => (
                                    <div key={c.id} className="flex items-center justify-between px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="grid size-9 place-items-center rounded-control bg-primary-subtle text-primary">
                                                <Icon name="trending" className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-body-sm font-semibold text-content">{c.description || 'Commission'}</p>
                                                <p className="flex items-center gap-1 text-caption text-subtle">
                                                    <Icon name="time" className="size-3" /> {relativeTime(c.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-title-sm font-display text-success">+{formatBDT(c.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Referred Friends List */}
                    {referees.length > 0 ? (
                        <Card padding="none" className="overflow-hidden">
                            <div className="p-5 pb-3">
                                <p className="text-caption uppercase tracking-wider text-muted">Your Referrals ({referees.length})</p>
                            </div>
                            <div className="divide-y divide-border">
                                {referees.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 px-5 py-4">
                                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-body-sm font-bold text-on-primary">
                                            {(r.fullName?.[0] || r.email?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-body-sm font-semibold text-content">{r.fullName || 'Anonymous'}</p>
                                            <p className="truncate text-caption text-subtle">{r.email}</p>
                                        </div>
                                        <Icon name="verified" className="size-4 shrink-0 text-success" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card className="py-12 text-center">
                            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-control bg-surface-sunken text-subtle">
                                <Icon name="user" className="size-7" />
                            </div>
                            <p className="text-body-sm font-semibold text-muted">No referrals yet</p>
                            <p className="mt-1 text-caption text-subtle">Share your link above to start earning!</p>
                        </Card>
                    )}

                    {/* How It Works */}
                    <Card padding="lg" className="space-y-4">
                        <p className="text-caption uppercase tracking-wider text-muted">How It Works</p>
                        {[
                            { step: '01', text: 'Copy your unique referral link above.' },
                            { step: '02', text: 'Share it with friends, family, or on social media.' },
                            { step: '03', text: 'When they sign up and make any purchase, you earn 5%.' },
                            { step: '04', text: 'Withdraw your earnings anytime (min. ৳100).' },
                        ].map(({ step, text }) => (
                            <div key={step} className="flex items-start gap-4">
                                <span className="shrink-0 rounded-control bg-primary-subtle px-2.5 py-1 text-caption font-bold text-primary">{step}</span>
                                <p className="text-body-sm font-medium leading-relaxed text-muted">{text}</p>
                            </div>
                        ))}
                    </Card>
                </Container>
            </div>

            <AnimatePresence>
                {showWithdraw && (
                    <WithdrawModal
                        available={availableBalance}
                        uid={currentUser?.uid}
                        onClose={() => setShowWithdraw(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
