import { CheckCircle2, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex justify-start mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to previous
                    </button>
                </div>
                <header className="text-center mb-16">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">Choose the perfect plan to maximize your property's visibility or manage multiple portfolios.</p>
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Free Plan */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="mb-6">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Basic</span>
                            <div className="text-4xl font-black text-slate-900 dark:text-white mt-2">Free</div>
                            <p className="text-slate-500 text-sm mt-2">Perfect for single landlords</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {['Post 1 active listing', 'Basic visibility', 'Standard support'].map((ft, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm">
                                    <CheckCircle2 size={18} className="text-emerald-500" /> {ft}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-200 transition-colors">Current Plan</button>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-primary p-8 rounded-[32px] shadow-2xl shadow-primary/20 flex flex-col relative transform md:-translate-y-4">
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-yellow-400 text-yellow-950 text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Star size={12} className="fill-yellow-950" /> Most Popular
                        </div>
                        <div className="mb-6">
                            <span className="text-xs font-black uppercase tracking-widest text-primary-200 text-white/70">Premium</span>
                            <div className="text-4xl font-black text-white mt-2">৳999 
                                <span className="text-lg text-white/70 font-bold">/mo</span>
                            </div>
                            <p className="text-white/80 text-sm mt-2">Maximize your reach instantly</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Post up to 5 properties', 
                                'Top of search results (Featured)', 
                                'Verified badge',
                                'Direct WhatsApp contact',
                                'Priority 24/7 support'
                            ].map((ft, i) => (
                                <li key={i} className="flex items-center gap-3 text-white font-medium text-sm">
                                    <CheckCircle2 size={18} className="text-emerald-300" /> {ft}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-4 rounded-2xl bg-white text-primary font-black hover:scale-[1.02] active:scale-95 transition-transform shadow-xl">Upgrade with bKash</button>
                    </div>

                    {/* Agent Plan */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="mb-6">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Agency / Corporate</span>
                            <div className="text-4xl font-black text-slate-900 dark:text-white mt-2">৳4,999
                                <span className="text-lg text-slate-500 font-bold">/mo</span>
                            </div>
                            <p className="text-slate-500 text-sm mt-2">For registered property agents</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Unlimited active listings', 
                                'Dedicated Agent Profile Page', 
                                'Lead management dashboard', 
                                'Team accounts'
                            ].map((ft, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm">
                                    <CheckCircle2 size={18} className="text-emerald-500" /> {ft}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black hover:scale-[1.02] active:scale-95 transition-all">Contact Sales</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
