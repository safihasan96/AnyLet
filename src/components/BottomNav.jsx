import { Link, useLocation } from 'react-router-dom';
import { Compass, Search, MessageSquare, User, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function BottomNav() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        if (!currentUser) {
            setUnreadCount(0);
            return;
        }

        const q = query(
            collection(db, 'viewing_requests'),
            where('ownerId', '==', currentUser.uid),
            where('isRead', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const NavItem = ({ to, icon, label, badge = false }) => {
        const active = isActive(to);
        return (
            <Link to={to} className="relative flex flex-col items-center gap-1 w-12 outline-none">
                <motion.div
                    className={`flex flex-col items-center gap-1 ${active ? 'text-[#3730a3]' : 'text-[#94a3b8]'}`}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                >
                    {active && (
                        <motion.div
                            layoutId="bottomNavDot"
                            className="absolute -top-3 w-5 h-1 bg-[#3730a3] rounded-full"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                    <div className="relative">
                        {icon(active)}
                        {badge && unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-1 flex size-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex size-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950" />
                            </span>
                        )}
                    </div>
                    <span className={`text-[10px] font-[800] tracking-wide transition-colors ${active ? 'text-[#3730a3]' : 'text-[#94a3b8]'}`}>
                        {label}
                    </span>
                </motion.div>
            </Link>
        );
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[450px] mx-auto bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 px-6 h-20 flex justify-between items-center z-50">
            <NavItem
                to="/"
                icon={(active) => <Compass size={24} strokeWidth={active ? 2.5 : 2} />}
                label={t('explore')}
            />
            <NavItem
                to="/search"
                icon={(active) => <Search size={24} strokeWidth={active ? 2.5 : 2} />}
                label={t('search')}
            />

            {/* Floating Center Button */}
            <div className="relative -top-6 flex justify-center w-20">
                <motion.div
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                >
                    <Link
                        to="/post-ad"
                        className="flex items-center justify-center size-[60px] rounded-full bg-[#3730a3] text-white shadow-xl shadow-[#3730a3]/30 border-[6px] border-[#f8fafc] dark:border-slate-950"
                    >
                        <motion.div
                            animate={{ rotate: isActive('/post-ad') ? 45 : 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            <Plus size={28} strokeWidth={3} />
                        </motion.div>
                    </Link>
                </motion.div>
            </div>

            <NavItem
                to="/requests"
                icon={(active) => <MessageSquare size={24} strokeWidth={active ? 2.5 : 2} />}
                label={t('messages')}
                badge={true}
            />
            <NavItem
                to="/profile"
                icon={(active) => <User size={24} strokeWidth={active ? 2.5 : 2} />}
                label={t('profile')}
            />
        </nav>
    );
}
