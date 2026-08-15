import { CheckCircle2, Star } from 'lucide-react';
import { useState } from 'react';
import PaymentModal from '../components/PaymentModal';
import { useFees } from '../hooks/useFees';
import { Card, Button, Badge } from '../components/ui';

const FREE_FEATURES   = ['Post 1 active listing', 'Basic visibility', 'Standard support'];
const PREMIUM_FEATURES = [
    'Post up to 5 properties',
    'Top of search results (Featured)',
    'Verified badge',
    'Direct WhatsApp contact',
    'Priority 24/7 support',
];

export default function Pricing() {
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan]         = useState(null);
    const { fees } = useFees();
    const premiumPrice = Number(fees?.subscriptionMonthlyPrice?.value) || 999;

    const handlePlanSelect = (planName, amount) => {
        setSelectedPlan({ name: planName, amount });
        setPaymentModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-surface-sunken py-12">
            <div className="max-w-5xl mx-auto px-6">

                <header className="text-center mb-16">
                    <h1 className="text-display-sm font-bold text-content mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-body-lg text-muted max-w-xl mx-auto leading-relaxed">
                        Choose the perfect plan to maximize your property&apos;s visibility or manage multiple portfolios.
                    </p>
                </header>

                <div className="grid md:grid-cols-2 max-w-3xl mx-auto gap-8 items-start">

                    {/* ── Free Plan ─────────────────────────────────── */}
                    <Card padding="lg" className="flex flex-col">
                        <div className="mb-6">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Basic</span>
                            <div className="text-[2.5rem] font-bold text-content mt-2 leading-none">Free</div>
                            <p className="text-body-sm text-muted mt-2">Perfect for single landlords</p>
                        </div>
                        <ul className="space-y-3.5 mb-8 flex-1">
                            {FREE_FEATURES.map((ft) => (
                                <li key={ft} className="flex items-center gap-3 text-body-sm text-muted">
                                    <CheckCircle2 size={17} className="text-success shrink-0" />
                                    {ft}
                                </li>
                            ))}
                        </ul>
                        <Button variant="secondary" size="lg" fullWidth disabled>
                            Current Plan
                        </Button>
                    </Card>

                    {/* ── Premium Plan ───────────────────────────────── */}
                    <div className="relative md:-translate-y-4">
                        {/* Most Popular badge */}
                        <div className="flex justify-center mb-0">
                            <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-yellow-950 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full mb-[-1px] relative z-10">
                                <Star size={11} className="fill-yellow-950" /> Most Popular
                            </span>
                        </div>
                        <div className="bg-primary rounded-card p-8 shadow-2xl shadow-primary/20 flex flex-col">
                            <div className="mb-6">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">Premium</span>
                                <div className="text-[2.5rem] font-bold text-white mt-2 leading-none">
                                    ৳{premiumPrice}
                                    <span className="text-body-lg text-white/60 font-medium ml-1">/mo</span>
                                </div>
                                <p className="text-body-sm text-white/70 mt-2">Maximize your reach instantly</p>
                            </div>
                            <ul className="space-y-3.5 mb-8 flex-1">
                                {PREMIUM_FEATURES.map((ft) => (
                                    <li key={ft} className="flex items-center gap-3 text-body-sm text-white">
                                        <CheckCircle2 size={17} className="text-success-light shrink-0" />
                                        {ft}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handlePlanSelect('Premium', premiumPrice)}
                                className="w-full py-3.5 rounded-control bg-white text-primary font-bold text-body-sm hover:scale-[1.02] active:scale-95 transition-transform shadow-xl"
                            >
                                Upgrade with bKash
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {selectedPlan && (
                <PaymentModal
                    isOpen={paymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    type="subscription"
                    bookingType="subscription"
                    amount={selectedPlan.amount}
                    title="Subscription Upgrade"
                    subtitle={`Upgrade to ${selectedPlan.name} Plan`}
                    breakdownItems={[
                        { label: `${selectedPlan.name} Subscription (1 Month)`, amount: selectedPlan.amount },
                    ]}
                    metadata={{ plan: selectedPlan.name }}
                />
            )}
        </div>
    );
}
