import { motion } from 'framer-motion';
import { Shield, Lock, Phone, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ctaVariants } from './motion';

/**
 * PropertyBookingCard — the desktop-only sticky "interested?" action card:
 * escrow/instant booking, request-viewing, call owner, and a WhatsApp link.
 * Presentational; booking/call/request are shell-provided callbacks.
 */
export default function PropertyBookingCard({
    property,
    isOwner,
    requestSent,
    requestSending,
    waUrl,
    onBook,
    onRequestViewing,
    onCall,
}) {
    const { t } = useLanguage();

    if (isOwner) {
        return (
            <div className="hidden lg:block bg-primary/5 p-8 rounded-[40px] border border-primary/20 text-center space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary dark:text-indigo-400 mb-2">Your Property</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">You are viewing your own listing.</p>
            </div>
        );
    }

    return (
        <div className="hidden lg:block bg-white dark:bg-[#1A1D24] p-8 rounded-[40px] border border-slate-100 dark:border-slate-800/70 shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">{t('interested')}</h3>

            {property.status !== 'Let Agreed' && property.status !== 'Booked' ? (
                <>
                    {property.instantBooking && property.securityDeposit > 0 && (
                        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary to-indigo-900 text-white relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 opacity-10 pointer-events-none">
                                <Shield size={80} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-1">
                                    <Lock size={16} className="text-white/80" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Escrow Booking</span>
                                </div>
                                <p className="text-xs text-indigo-100 font-medium mb-3 leading-relaxed">
                                    Pay ৳{property.securityDeposit?.toLocaleString()} deposit. <span className="text-white font-black">100% refundable</span> if you don't move in.
                                </p>
                                <button
                                    onClick={onBook}
                                    className="w-full py-3 bg-white text-primary dark:text-indigo-400 font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Shield size={16} className="fill-indigo-100" /> Book Now
                                </button>
                            </div>
                        </div>
                    )}
                    {property.instantBooking && (!property.securityDeposit || property.securityDeposit === 0) && (
                        <button
                            onClick={onBook}
                            className="w-full py-5 rounded-2xl bg-gradient-to-br from-primary to-indigo-900 text-white font-black text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4 shadow-xl shadow-primary/20"
                        >
                            <Shield size={20} className="fill-indigo-100" /> Book Now
                        </button>
                    )}
                    <motion.button
                        onClick={onRequestViewing}
                        disabled={requestSent || requestSending}
                        variants={!requestSent ? ctaVariants : {}}
                        initial="idle"
                        animate={!requestSent ? 'pulse' : 'idle'}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        className={`w-full py-5 rounded-2xl font-black text-lg transition-colors shadow-xl mb-4 ${requestSent ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}
                    >
                        {requestSending ? 'Sending...' : requestSent ? 'Request Sent ✓' : t('request_viewing')}
                    </motion.button>
                    <button
                        onClick={onCall}
                        className="w-full py-5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Phone size={20} /> {t('call_owner')}
                    </button>
                </>
            ) : (
                <div className={`${property.status === 'Booked' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'} border p-4 rounded-2xl text-center font-bold text-sm mb-4`}>
                    This property has been {property.status} and is no longer available for viewings.
                </div>
            )}

            {waUrl && (
                <div className="flex justify-center mt-4">
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold text-sm transition-colors"
                    >
                        <MessageCircle size={16} /> Contact on WhatsApp
                    </a>
                </div>
            )}
        </div>
    );
}
