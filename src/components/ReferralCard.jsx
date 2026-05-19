/**
 * ReferralCard.jsx
 *
 * A compact inline card for the Profile page.
 * Shows: quick copy link, stats (referrals, earnings, balance), and a CTA.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Copy, Check, ChevronRight, TrendingUp } from 'lucide-react';
import { useReferral } from '../hooks/useReferral';
import { formatBDT } from '../utils/referral';

export default function ReferralCard() {
    const navigate = useNavigate();
    const { referralLink, referees, totalEarned, availableBalance, loading } = useReferral();
    const [copied, setCopied] = useState(false);

    function copyLink() {
        navigator.clipboard.writeText(referralLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    }

    if (loading) return null;

    return (
        <div className="bg-gradient-to-br from-[#1a227f] to-[#3730a3] rounded-[28px] p-5 text-white relative overflow-hidden">
            {/* decorative blobs */}
            <div className="absolute -right-6 -top-6 size-28 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute right-4 bottom-0 size-14 rounded-full bg-white/5 pointer-events-none" />

            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="size-8 bg-white/15 rounded-xl flex items-center justify-center">
                        <Gift size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Refer & Earn</span>
                </div>
                <button
                    onClick={() => navigate('/referral')}
                    className="flex items-center gap-1 text-[10px] font-black text-white/70 hover:text-white transition-colors"
                >
                    View All <ChevronRight size={12} />
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                    { label: 'Referred', value: referees.length },
                    { label: 'Total Earned', value: formatBDT(totalEarned) },
                    { label: 'Available', value: formatBDT(availableBalance) },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white/10 rounded-[16px] px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-0.5">{label}</p>
                        <p className="text-sm font-black text-white truncate">{value}</p>
                    </div>
                ))}
            </div>

            {/* Link + Copy */}
            <div className="flex items-center gap-2 bg-white/10 rounded-2xl p-1 pl-4">
                <p className="text-[11px] font-bold text-white/70 truncate flex-1">{referralLink}</p>
                <button
                    onClick={copyLink}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black transition-all ${
                        copied ? 'bg-emerald-400 text-white' : 'bg-white text-primary hover:bg-white/90'
                    }`}
                >
                    {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
            </div>

            {/* 5% label */}
            <div className="flex items-center gap-1.5 mt-3 text-white/50">
                <TrendingUp size={12} />
                <span className="text-[10px] font-bold">Earn 5% on every purchase your referrals make — for life.</span>
            </div>
        </div>
    );
}
