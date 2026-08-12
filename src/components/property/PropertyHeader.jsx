import { motion } from 'framer-motion';
import { CheckCircle2, Lock, AlertTriangle, MapPin, Map, Maximize, ShieldCheck, Shield, Star, Zap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { sectionVariants } from './motion';

/**
 * PropertyHeader — the hero block: status badge, title, location/verification
 * chips, price tag, and the escrow-booking + rental-history trust banners.
 * Presentational; `onBook` / `onSeeOnMap` are shell callbacks.
 */
export default function PropertyHeader({ property, isOwner, onBook, onSeeOnMap }) {
    const { t } = useLanguage();

    return (
        <>
            {/* Title, Stats & Price */}
            <motion.div variants={sectionVariants} className="mb-8 md:mb-10 px-4 md:px-0 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                <div className="flex-1">
                    {property.status && property.status !== 'Available' && (
                        <div className={`inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest border shadow-sm ${
                            property.status === 'Let Agreed'
                                ? 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                                : property.status === 'Booked'
                                    ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
                                    : 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                        }`}>
                            {property.status === 'Let Agreed' ? <CheckCircle2 size={14} strokeWidth={3} /> : property.status === 'Booked' ? <Lock size={14} strokeWidth={3} /> : <AlertTriangle size={14} strokeWidth={3} />}
                            {property.status}
                        </div>
                    )}
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                        {property.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm md:text-base text-slate-500 font-bold">
                        <span className="flex items-center gap-1.5 break-all md:break-normal"><MapPin size={18} className="text-primary dark:text-indigo-400 shrink-0" /> {property.addressDetails ? `${property.addressDetails}, ` : ''}{property.upazila}, {property.district}</span>

                        <button
                            onClick={onSeeOnMap}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black transition-colors border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                        >
                            <Map size={14} /> See on Map
                        </button>

                        {property.area && <span className="flex items-center gap-1.5"><Maximize size={18} className="shrink-0" /> {property.area} {t('sqft')}</span>}
                        {property.isPropertyVerified && <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg text-xs font-black"><ShieldCheck size={14} className="text-emerald-600 shrink-0" /> AnyLet Verified</span>}
                        {property.isVerified && <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg text-xs font-black"><ShieldCheck size={14} className="text-indigo-600 shrink-0" /> Verified Landlord</span>}
                        {property.isOnsiteVerified && (
                            <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-black">
                                <Shield size={14} className="fill-blue-100 dark:fill-blue-500/20" /> Onsite Verified
                            </span>
                        )}
                        {property.reviewCount > 0 && (
                            <a href="#reviews" onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                            }} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-lg text-xs font-black hover:bg-amber-100 transition-colors cursor-pointer">
                                <Star size={14} className="fill-amber-500" />
                                {Number(property.reviewScore || 0).toFixed(1)} ({property.reviewCount} Reviews)
                            </a>
                        )}
                    </div>
                </div>

                {/* Price Tag & Utilities */}
                <div className="bg-primary/5 p-5 md:p-6 rounded-3xl border border-primary/10 shrink-0 flex flex-col md:items-end">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-indigo-400/70 mb-1">{t('rent')}</p>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl md:text-4xl font-black text-primary dark:text-indigo-400 hover:scale-105 transition-transform origin-left md:origin-right">৳{property.rent?.toLocaleString()}</span>
                        <span className="text-lg font-bold text-slate-500">/{property.billingCycle}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                        <Zap size={14} className="text-amber-500" />
                        {property.utilitiesCost ? `+ ৳${property.utilitiesCost?.toLocaleString()} monthly utilities` : 'Utilities included'}
                    </div>
                </div>
            </motion.div>

            {/* Booking Banner (Escrow) */}
            {!isOwner && property.securityDeposit > 0 && property.status === 'Available' && (
                <div className="mb-6 md:mb-10 px-4 md:px-0">
                    <div className="bg-gradient-to-br from-primary to-indigo-900 rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl shadow-primary/20">
                        <div className="absolute -top-10 -right-10 p-8 opacity-10 pointer-events-none rotate-12">
                            <Shield size={160} />
                        </div>
                        <div className="flex items-start gap-4 md:gap-6 relative z-10 w-full md:w-auto">
                            <div className="size-14 md:size-16 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                                <Lock size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight">Secure this property instantly</h3>
                                <p className="text-sm md:text-base text-indigo-100 font-medium leading-relaxed max-w-md">
                                    Pay the <span className="text-white font-black">৳{property.securityDeposit.toLocaleString()}</span> security deposit via Any-Let Escrow.
                                    Safe, secure, and <span className="text-white font-black border-b border-indigo-300">100% refundable</span> if you don't move in.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onBook}
                            className="w-full md:w-auto py-4 px-8 bg-white hover:bg-slate-50 text-primary dark:text-indigo-400 font-black text-base md:text-lg rounded-2xl shadow-xl shadow-black/10 active:scale-95 transition-all shrink-0 relative z-10 flex items-center justify-center gap-2"
                        >
                            <Shield size={20} className="fill-indigo-100" /> Book Now
                        </button>
                    </div>
                </div>
            )}

            {/* Rental History Trust Banner */}
            {property.rentHistoryCount > 0 && (
                <div className="mb-6 md:mb-10 px-4 md:px-0">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                        <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300">Trusted Property</h3>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500/80 mt-0.5">
                                This property has been securely rented <span className="font-black text-emerald-700 dark:text-emerald-400">{property.rentHistoryCount} times</span> via AnyLet since {property.createdAt?.toDate ? property.createdAt.toDate().getFullYear() : '2023'}.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
