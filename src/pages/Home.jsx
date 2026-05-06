import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronDown, Bell, User, Search, SlidersHorizontal, Building2, Users, Bed, DoorOpen, Download, Smartphone } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import FeaturedListings from '../components/FeaturedListings';
import { Helmet } from 'react-helmet-async';
import PromotedAds from '../components/PromotedAds';
import { bdLocations } from '../data/locations';


import { motion } from 'framer-motion';

export default function Home() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [hasUnread, setHasUnread] = useState(false);
    const [selectedDivision, setSelectedDivision] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'viewing_requests'),
            where('ownerId', '==', currentUser.uid),
            where('isRead', '==', false)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHasUnread(!snapshot.empty);
        });
        return () => unsubscribe();
    }, [currentUser]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-24 bg-background-light dark:bg-background-dark min-h-screen"
        >
            <Helmet>
                <title>Any-Let | The Smartest Way to Rent in Bangladesh</title>
                <meta name="description" content="Discover verified properties for rent in Dhaka, Chittagong, and across Bangladesh. Connect with trusted landlords securely on Any-Let." />
            </Helmet>
            {/* Mobile Header - Hidden on Desktop */}
            <header className="flex md:hidden items-center px-4 py-6 justify-between sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-2 rounded-xl text-white">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">Location</p>
                        <div className="flex items-center gap-1 relative">
                            <select 
                                value={selectedDivision}
                                onChange={(e) => setSelectedDivision(e.target.value)}
                                className="text-slate-900 dark:text-slate-100 text-sm font-black leading-tight bg-transparent appearance-none outline-none pr-4 z-10"
                            >
                                <option value="">All Divisions</option>
                                {Object.keys(bdLocations).map(div => (
                                    <option key={div} value={div}>{div}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="text-primary absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link to="/notifications" className="relative flex size-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 transition-transform active:scale-95">
                        <Bell size={20} />
                        {hasUnread && (
                            <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800" />
                        )}
                    </Link>
                    <Link to="/profile" className="flex size-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 transition-transform active:scale-95">
                        <User size={20} />
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="px-4 py-6 md:py-12">
                    <div className="flex flex-col gap-6 md:gap-10">
                        <motion.h1 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-3xl md:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white max-w-2xl"
                        >
                            {t('hero_title')} <span className="text-primary italic">{t('hero_perfect')}</span> {t('hero_space')} <span className="underline decoration-primary decoration-4 underline-offset-8">{t('hero_seconds')}</span>.
                        </motion.h1>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl">
                                <div className="hidden md:flex flex-col justify-center px-6 rounded-3xl bg-white dark:bg-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 min-w-[200px]">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">Division</p>
                                    <div className="flex items-center gap-1 relative">
                                        <select 
                                            value={selectedDivision}
                                            onChange={(e) => setSelectedDivision(e.target.value)}
                                            className="text-slate-900 dark:text-slate-100 text-sm font-black leading-tight bg-transparent appearance-none outline-none w-full cursor-pointer pr-4"
                                        >
                                            <option value="">All Divisions</option>
                                            {Object.keys(bdLocations).map(div => (
                                                <option key={div} value={div}>{div}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="text-primary absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                <Link to={`/search${selectedDivision ? `?division=${selectedDivision}` : ''}`} className="flex-1 flex w-full items-stretch rounded-3xl h-16 md:h-20 bg-white dark:bg-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer hover:border-primary/50 transition-all group">
                                    <div className="text-slate-400 flex items-center justify-center pl-6 group-hover:text-primary transition-colors">
                                        <Search size={26} />
                                    </div>
                                    <div className="flex items-center w-full px-4 text-lg font-semibold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                        {t('search_placeholder')}
                                    </div>
                                    <div className="flex items-center pr-3">
                                        <div className="bg-primary text-white h-12 md:h-14 px-6 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                                            <span className="hidden md:inline mr-2 font-bold">{t('search')}</span>
                                            <SlidersHorizontal size={20} />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Get the App Banner */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="px-4 mt-3 mb-8"
                >
                    <Link to="/download">
                        <div className="flex items-center gap-4 bg-gradient-to-r from-primary to-primary/80 rounded-3xl px-6 py-4 shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform cursor-pointer">
                            <div className="bg-white/20 p-3 rounded-2xl shrink-0">
                                <Smartphone size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-black text-lg leading-tight">Get the Any-Let Pro App</p>
                                <p className="text-white/70 text-sm font-medium">Install for free — no app store needed</p>
                            </div>
                            <div className="bg-white/10 p-2 rounded-full">
                                <Download size={20} className="text-white" />
                            </div>
                        </div>
                    </Link>
                </motion.div>

                <PromotedAds />

                <div className="mt-12">
                    <div className="flex items-center justify-between px-4 mb-6">
                        <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight">{t('categories')}</h3>
                    </div>
                    <div className="flex gap-6 px-4 overflow-x-auto no-scrollbar pb-4">
                        <CategoryItem icon={<Building2 size={30} />} label={t('flat')} to={`/search?type=Apartment${selectedDivision ? `&division=${selectedDivision}` : ''}`} active />
                        <CategoryItem icon={<Users size={30} />} label={t('sublet')} to={`/search?type=Sublet${selectedDivision ? `&division=${selectedDivision}` : ''}`} />
                        <CategoryItem icon={<Bed size={30} />} label={t('room')} to={`/search?type=Room${selectedDivision ? `&division=${selectedDivision}` : ''}`} />
                        <CategoryItem icon={<DoorOpen size={30} />} label={t('mess')} to={`/search?type=Mess${selectedDivision ? `&division=${selectedDivision}` : ''}`} />
                    </div>
                </div>

                <div className="mt-8">
                    <FeaturedListings />
                </div>
            </main>
        </motion.div>
    );
}

function CategoryItem({ icon, label, active = false, to }) {
    return (
        <Link to={to} className="flex flex-col items-center gap-2 min-w-[80px] group">
            <div className={`size-16 rounded-2xl shadow-lg flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-primary/50 ${active
                ? 'bg-primary text-white shadow-primary/30 scale-105'
                : 'bg-white dark:bg-slate-800 text-primary border border-slate-100 dark:border-slate-700 shadow-slate-200/50 dark:shadow-none'
                }`}>
                {icon}
            </div>
            <p className={`text-[11px] font-black uppercase tracking-wider group-hover:text-primary transition-colors ${active ? 'text-primary' : 'text-slate-500'}`}>{label}</p>
        </Link>
    );
}
