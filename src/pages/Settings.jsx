import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { ArrowLeft, Moon, Sun, LogOut, ChevronRight, Bell, Globe } from 'lucide-react';
import logger from '../utils/logger';

export default function Settings() {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { currentUser } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (err) {
            logger.error(err);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 pb-32">
            {/* Header */}
            <header className="flex items-center p-6 bg-white dark:bg-slate-950 sticky top-0 z-10 border-b border-[#f1f5f9] dark:border-slate-800">
                <button onClick={() => navigate(-1)} className="text-[#1a227f] dark:text-white p-2 border border-transparent mr-4">
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <h1 className="text-[14px] font-[900] text-[#1a227f] dark:text-white tracking-[0.2em] uppercase">{t('settings')}</h1>
            </header>

            <div className="px-6 py-6 space-y-8">
                {/* Preferences */}
                <section className="space-y-3">
                    <h3 className="text-[10px] font-[900] uppercase tracking-[0.2em] text-[#94a3b8] ml-1">App Preferences</h3>
                    <div className="bg-[#f8fafc] dark:bg-slate-900 border border-[#f1f5f9] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm divide-y divide-[#f1f5f9] dark:divide-slate-800">
                        
                        <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4">
                                <div className="size-9 bg-white dark:bg-slate-800 border border-[#f1f5f9] dark:border-slate-700 rounded-[14px] flex items-center justify-center text-[#94a3b8] shadow-sm">
                                    {isDark ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
                                </div>
                                <span className="text-sm font-[800] text-[#1e293b] dark:text-slate-200">{t('dark_mode')}</span>
                            </div>
                            <button 
                                onClick={toggleTheme}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-[#3E2B88]' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <div className={`size-4 bg-white rounded-full shadow-sm transform transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4">
                                <div className="size-9 bg-white dark:bg-slate-800 border border-[#f1f5f9] dark:border-slate-700 rounded-[14px] flex items-center justify-center text-[#94a3b8] shadow-sm">
                                    <Globe size={18} strokeWidth={2} />
                                </div>
                                <span className="text-sm font-[800] text-[#1e293b] dark:text-slate-200">{t('language')}</span>
                            </div>
                            <select 
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-transparent border-none text-primary dark:text-indigo-400 font-[900] text-sm uppercase tracking-wider outline-none"
                            >
                                <option value="en">English</option>
                                <option value="bn">বাংলা</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4">
                                <div className="size-9 bg-white dark:bg-slate-800 border border-[#f1f5f9] dark:border-slate-700 rounded-[14px] flex items-center justify-center text-[#94a3b8] shadow-sm">
                                    <Bell size={18} strokeWidth={2} />
                                </div>
                                <span className="text-sm font-[800] text-[#1e293b] dark:text-slate-200">{t('notifications')}</span>
                            </div>
                            <button 
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-[#3E2B88]' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <div className={`size-4 bg-white rounded-full shadow-sm transform transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                    </div>
                </section>

                {/* Account Actions */}
                <section className="space-y-3">
                    <h3 className="text-[10px] font-[900] uppercase tracking-[0.2em] text-[#94a3b8] ml-1">Account Actions</h3>
                    
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-5 bg-[#ffe4e6] dark:bg-rose-950/20 border border-transparent rounded-[24px] group transition-transform active:scale-95 text-[#e11d48]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="size-9 bg-white dark:bg-slate-800 rounded-[14px] flex items-center justify-center text-[#e11d48] shadow-sm">
                                <LogOut size={18} strokeWidth={2} />
                            </div>
                            <span className="text-sm font-[800]">{t('sign_out')}</span>
                        </div>
                    </button>
                </section>
            </div>
        </div>
    );
}
