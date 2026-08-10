import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Map, MessageSquare, User, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { subscribeToUnreadCount } from '../utils/messageService';

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

        const unsub = subscribeToUnreadCount(currentUser.uid, (total) => {
            setUnreadCount(total);
        });

        return () => unsub();
    }, [currentUser]);

    return (
        <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/80 dark:bg-[#0F1117]/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}>
            <div className="flex justify-evenly items-center px-1 sm:px-6 w-full h-[4.5rem]">
                <NavItem
                    to="/"
                    isActive={isActive}
                    icon={(active) => <Compass size={24} strokeWidth={active ? 2.5 : 2} />}
                    label={t('explore')}
                />
                <NavItem
                    to="/map"
                    isActive={isActive}
                    icon={(active) => <Map size={24} strokeWidth={active ? 2.5 : 2} />}
                    label="Map"
                />

                {/* Floating Center Button */}
                <div className="relative -top-6 flex justify-center w-16 sm:w-20 shrink-0">
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                        <Link
                            to="/post-ad"
                            className="flex items-center justify-center size-[56px] sm:size-[60px] rounded-full bg-primary text-white shadow-xl shadow-primary/30 border-[4px] sm:border-[6px] border-[#F8F9FA] dark:border-[#0F1117]"
                            aria-label="Post Ad"
                        >
                            <motion.div
                                animate={{ rotate: isActive('/post-ad') ? 45 : 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                                <Plus size={26} strokeWidth={3} className="sm:w-7 sm:h-7" />
                            </motion.div>
                        </Link>
                    </motion.div>
                </div>

                <NavItem
                    to="/messages"
                    isActive={isActive}
                    icon={(active) => <MessageSquare size={24} strokeWidth={active ? 2.5 : 2} />}
                    label={t('messages')}
                    badge={true}
                    unreadCount={unreadCount}
                />
                <NavItem
                    to="/profile"
                    isActive={isActive}
                    icon={(active) => <User size={24} strokeWidth={active ? 2.5 : 2} />}
                    label={t('profile')}
                />
            </div>
        </nav>
    );
}

const NavItem = ({ to, icon, label, badge = false, unreadCount = 0, isActive }) => {
    const active = isActive(to);
    return (
        <Link to={to} className="relative flex flex-col items-center gap-1 w-12 outline-none group">
            <motion.div
                className={`flex flex-col items-center gap-1 ${active ? 'text-primary dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors'}`}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
                {active && (
                    <motion.div
                        layoutId="bottomNavDot"
                        className="absolute -top-3 w-5 h-[3px] bg-primary dark:bg-indigo-400 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                )}
                <div className="relative">
                    {icon(active)}
                    {badge && unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-1 flex size-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex size-3 rounded-full bg-rose-500 border-2 border-white dark:border-[#0F1117]" />
                        </span>
                    )}
                </div>
                <span className={`text-[10px] font-[800] tracking-wide transition-colors ${active ? 'text-primary dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                    {label}
                </span>
            </motion.div>
        </Link>
    );
};
