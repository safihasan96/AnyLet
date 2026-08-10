import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, ArrowLeft, Building2, CheckCircle2, MapPin, AlertTriangle, ShieldCheck, ShieldAlert, Star, Wallet, Activity, Loader2, Info, MessageSquare, Clock, ChevronRight, CreditCard } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';

export default function Notifications() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort client-side
            data.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });
            setNotifications(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = async (notif) => {
        if (!notif.isRead) {
            try {
                await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
            } catch (err) {
                logger.error("Error marking notification as read:", err);
            }
        }
        if (notif.link) {
            navigate(notif.link);
        }
    };

    const markAllAsRead = async () => {
        const unreadNotifs = notifications.filter(n => !n.isRead);
        if (unreadNotifs.length === 0) return;

        try {
            const batch = writeBatch(db);
            unreadNotifs.forEach(n => {
                const ref = doc(db, 'notifications', n.id);
                batch.update(ref, { isRead: true });
            });
            await batch.commit();
        } catch (err) {
            logger.error("Error marking all as read:", err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'request_received': return <MessageSquare size={20} />;
            case 'booking_confirmed': return <CreditCard size={20} />;
            case 'property_approved': return <ShieldCheck size={20} />;
            case 'review_received': return <Star size={20} />;
            case 'system': return <Info size={20} />;
            default: return <Bell size={20} />;
        }
    };

    const getIconColor = (type, isRead) => {
        if (isRead) return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
        switch (type) {
            case 'request_received': return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
            case 'booking_confirmed': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
            case 'property_approved': return 'bg-primary/10 text-primary dark:text-indigo-400';
            case 'review_received': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
            case 'system': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            default: return 'bg-primary/10 text-primary dark:text-indigo-400';
        }
    };
    // Framer Motion variants for premium entrance animations
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, when: "beforeChildren" },
      },
    };
    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 },
      },
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">


            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Recent</h2>
                    {notifications.some(n => !n.isRead) && (
                        <button onClick={markAllAsRead} className="text-xs font-bold text-primary dark:text-indigo-400 hover:underline">
                            Mark all as read
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                            <Bell size={32} />
                        </div>
                        <p className="font-bold text-slate-500">No notifications yet</p>
                    </div>
                ) : (
            <AnimatePresence>
                <motion.div
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    {notifications.map(notif => (
                        <motion.div
                            key={notif.id}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => markAsRead(notif)}
                            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${notif.isRead
                                ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-70'
                                : 'bg-white dark:bg-slate-800 border-primary shadow-sm ring-1 ring-primary/10'}`}
                        >
                            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(notif.type, notif.isRead)}`}> {getIcon(notif.type)} </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className={`text-sm tracking-tight ${notif.isRead ? 'font-bold text-slate-600 dark:text-slate-300' : 'font-black text-slate-900 dark:text-white'}`}> {notif.title} </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed"> {notif.message} </p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <Clock size={10} className="text-slate-400" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                    </span>
                                </div>
                            </div>
                            {!notif.isRead && <div className="size-2.5 bg-primary rounded-full mt-2 shrink-0" />}
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
                )}
            </div>
        </div>
    );
}
