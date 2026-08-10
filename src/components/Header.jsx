import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  ChevronDown, 
  User, 
  LogOut, 
  Heart, 
  List, 
  Settings, 
  ShieldCheck, 
  Bell,
  Search,
  Plus,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeToUnreadCount } from '../utils/messageService';
import logger from '../utils/logger';
import { fadeDown } from '../lib/motion';
import { useAnimationSafe } from '../hooks/useAnimationSafe';

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [currency, setCurrency] = useState('BDT');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const dropdownRef = useRef(null);
  const { currentUser, logout, userProfile, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldAnimate = useAnimationSafe();

  useEffect(() => {
    if (!currentUser) {
        setUnreadCount(0);
        setUnreadNotificationCount(0);
        return;
    }

    const unsubReq = subscribeToUnreadCount(currentUser.uid, (total) => {
        setUnreadCount(total);
    });

    const qNotif = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        where('isRead', '==', false)
    );

    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
        setUnreadNotificationCount(snapshot.size);
    });

    return () => {
        unsubReq();
        unsubNotif();
    };
  }, [currentUser]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      return !prev;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      logger.error("Failed to log out", error);
    }
  };

  return (
    <motion.header 
      className="bg-white/70 dark:bg-[#0F1117]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50"
      variants={shouldAnimate ? fadeDown : {}}
      initial="hidden"
      animate="show"
    >
      <div className="mx-auto px-6 h-20 flex items-center justify-between lg:max-w-[1400px] max-w-7xl">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary dark:bg-indigo-500 p-2.5 rounded-2xl text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
              <Building2 size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              any<span className="text-primary dark:text-indigo-400 italic">.let</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-10">
          {[
            { path: '/', label: 'Explore' },
            { path: '/map', label: 'Map' },
            { path: '/messages', label: 'Messages' },
            { path: '/profile', label: 'Profile' }
          ].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative py-1 text-[16px] transition-colors ${
                  isActive 
                    ? 'font-bold text-[#1a227f] dark:text-indigo-400' 
                    : 'font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
                {item.path === '/messages' && (unreadCount > 0 || unreadNotificationCount > 0) && (
                  <span className="absolute -top-1 -right-3.5 flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="header-active-underline"
                    className="absolute -bottom-1.5 left-0 right-0 h-[2.5px] bg-[#1a227f] dark:bg-indigo-400 rounded-t-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {currentUser && (
            currentUser.emailVerified ? (
              <Link
                to="/post-ad"
                className="hidden lg:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
              >
                <Plus size={16} strokeWidth={3} />
                Post Ad
              </Link>
            ) : (
              <button
                onClick={() => navigate('/verify-email')}
                className="hidden lg:flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-rose-500/20 hover:scale-105 transition-transform active:scale-95 animate-pulse"
              >
                <ShieldCheck size={16} />
                Verify Now
              </button>
            )
          )}

          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/40 transition-all"
                aria-label="User menu"
              >
                <div className="relative size-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">
                  {currentUser.email?.charAt(0).toUpperCase()}
                  {(unreadCount > 0 || unreadNotificationCount > 0) && (
                      <span className="absolute -top-1 -right-1 flex size-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex size-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-800" />
                      </span>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[12px] font-black text-slate-900 dark:text-white truncate max-w-[120px] leading-none mb-1">
                    {userProfile?.fullName || currentUser.email}
                  </p>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest leading-none">
                    {userProfile?.role || 'Member'}
                  </p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      <DropdownItem to="/my-listings" onClick={() => setIsDropdownOpen(false)} icon={<List size={18} />} label="My Ads" />
                      <DropdownItem to="/messages" onClick={() => setIsDropdownOpen(false)} icon={<MessageSquare size={18} />} label="Messages" badgeCount={unreadCount} />
                      <DropdownItem to="/notifications" onClick={() => setIsDropdownOpen(false)} icon={<Bell size={18} />} label="Notifications" badgeCount={unreadNotificationCount} />
                      <DropdownItem to="/profile" onClick={() => setIsDropdownOpen(false)} icon={<User size={18} />} label="My Profile" />
                      <DropdownItem to="/favorites" onClick={() => setIsDropdownOpen(false)} icon={<Heart size={18} />} label="Saved Items" />
                      {userProfile?.role === 'admin' && (
                        <DropdownItem to="/admin" onClick={() => setIsDropdownOpen(false)} icon={<ShieldCheck size={18} />} label="Admin Panel" />
                      )}
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-3" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:block text-sm font-black text-slate-600 dark:text-slate-300 hover:text-primary dark:text-indigo-400 px-4">Log in</Link>
              <Link to="/signup" className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

function DropdownItem({ to, icon, label, onClick, badgeCount }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center justify-between px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary dark:text-indigo-400 transition-all font-bold text-sm group">
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {badgeCount > 0 && (
        <span className="flex items-center justify-center bg-rose-500 text-white text-[10px] font-black size-5 rounded-full shadow-md shadow-rose-500/30">
          {badgeCount}
        </span>
      )}
    </Link>
  );
}
