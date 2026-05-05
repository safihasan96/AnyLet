import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [currency, setCurrency] = useState('BDT');
  const dropdownRef = useRef(null);
  const { currentUser, logout, userProfile, login } = useAuth();
  const navigate = useNavigate();

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
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2.5 rounded-2xl text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
            <Building2 size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
            any<span className="text-primary italic">.let</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          <NavLink to="/" label="Home" />
          <NavLink to="/search" label="Discover" />
          <NavLink to="/download" label="App" />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {currentUser && !currentUser.emailVerified && (
            <button
              onClick={() => navigate('/settings')}
              className="hidden lg:flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-rose-500/20 hover:scale-105 transition-transform active:scale-95 animate-pulse"
            >
              <ShieldCheck size={16} />
              Verify Now
            </button>
          )}

          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/40 transition-all"
              >
                <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">
                  {currentUser.email?.charAt(0).toUpperCase()}
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
              <Link to="/login" className="hidden sm:block text-sm font-black text-slate-600 dark:text-slate-300 hover:text-primary px-4">Log in</Link>
              <Link to="/signup" className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label }) {
  return (
    <Link to={to} className="text-sm font-black text-slate-500 hover:text-primary transition-colors tracking-tight uppercase relative group">
      {label}
      <span className="absolute -bottom-2 left-0 w-0 h-1 bg-primary rounded-full transition-all group-hover:w-full" />
    </Link>
  );
}

function DropdownItem({ to, icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all font-bold text-sm">
      {icon}
      {label}
    </Link>
  );
}
