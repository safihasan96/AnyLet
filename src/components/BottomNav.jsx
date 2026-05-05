import { Link, useLocation } from 'react-router-dom';
import { Compass, Search, MessageSquare, User, Plus, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';


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


    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[450px] mx-auto bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 px-6 h-20 flex justify-between items-center z-50">
            <Link to="/" className={`flex flex-col items-center gap-1.5 w-12 ${isActive('/') ? 'text-[#3730a3]' : 'text-[#94a3b8]'}`}>
                <Compass size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
                <span className="text-[10px] font-[800] tracking-wide">{t('explore')}</span>
            </Link>

            <Link to="/search" className={`flex flex-col items-center gap-1.5 w-12 ${isActive('/search') ? 'text-[#3730a3]' : 'text-[#94a3b8]'}`}>
                <Search size={24} strokeWidth={isActive('/search') ? 2.5 : 2} />
                <span className="text-[10px] font-[800] tracking-wide">{t('search')}</span>
            </Link>

            {/* Floating Center Button */}
            <div className="relative -top-6 flex justify-center w-20">
                <Link to="/post-ad" className="flex items-center justify-center size-[60px] rounded-full bg-[#3730a3] text-white shadow-xl shadow-[#3730a3]/30 border-[6px] border-[#f8fafc] dark:border-slate-950 transition-transform active:scale-90">
                    <Plus size={28} strokeWidth={3} />
                </Link>
            </div>

            <Link to="/requests" className={`flex flex-col items-center gap-1.5 w-12 relative ${isActive('/requests') ? 'text-[#3730a3]' : 'text-[#94a3b8]'}`}>
                <MessageSquare size={24} strokeWidth={isActive('/requests') ? 2.5 : 2} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 right-0.5 flex size-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex size-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-950" />
                    </span>
                )}
                <span className="text-[10px] font-[800] tracking-wide">{t('messages')}</span>
            </Link>


            <Link to="/profile" className={`flex flex-col items-center gap-1.5 w-12 ${isActive('/profile') ? 'text-[#3730a3]' : 'text-[#94a3b8]'}`}>
                <User size={24} strokeWidth={isActive('/profile') ? 2.5 : 2} />
                <span className="text-[10px] font-[800] tracking-wide">{t('profile')}</span>
            </Link>
        </nav>
    );
}
