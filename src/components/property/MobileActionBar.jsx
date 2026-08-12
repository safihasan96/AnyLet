import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Phone, MessageCircle, Flag } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { bottomBarVariants, ctaVariants } from './motion';

/**
 * MobileActionBar — the scroll-flow action block shown below the content on
 * mobile: book / request-viewing / call owner, WhatsApp link, and report link.
 * Renders nothing for the owner. Booking/call/request are shell callbacks
 * (shared with the desktop booking card).
 */
export default function MobileActionBar({
    property,
    isOwner,
    id,
    requestSent,
    requestSending,
    waUrl,
    onBook,
    onRequestViewing,
    onCall,
}) {
    const { t } = useLanguage();

    if (isOwner) return null;

    return (
        <motion.div variants={bottomBarVariants} initial="hidden" animate="visible" className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 px-4">
            <h3 className="text-xl font-black mb-6 text-slate-900 dark:text-white text-center">{t('interested')}</h3>

            {property.status !== 'Let Agreed' && property.status !== 'Booked' ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {property.instantBooking && (
                        <motion.button
                            onClick={onBook}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            className="w-full h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-900 text-white font-black text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                        >
                            <Shield size={20} className="fill-indigo-100" /> Book Now
                        </motion.button>
                    )}
                    <motion.button
                        onClick={onRequestViewing}
                        disabled={requestSent || requestSending}
                        variants={!requestSent ? ctaVariants : {}}
                        initial="idle"
                        animate={!requestSent ? 'pulse' : 'idle'}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        className={`w-full flex justify-center items-center h-14 rounded-2xl font-black text-lg transition-colors shadow-xl ${requestSent ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}
                    >
                        {requestSending ? 'Sending...' : requestSent ? 'Request Sent ✓' : t('request_viewing')}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={onCall}
                        className="w-full h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors flex items-center justify-center gap-3"
                    >
                        <Phone size={20} /> {t('call_owner')}
                    </motion.button>
                </div>
            ) : (
                <div className={`${property.status === 'Booked' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'} border p-4 rounded-2xl text-center font-bold text-sm mb-2`}>
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
            <div className="mt-8 flex justify-center">
                <Link to={`/report-property/${id}`}
                    state={{ property }}
                    className="flex items-center gap-2 text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors py-4 px-8"
                >
                    <Flag size={16} /> Report this ad
                </Link>
            </div>
        </motion.div>
    );
}
