import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, Bell, Search, SlidersHorizontal, Building2, Users, Bed, DoorOpen, Home as HomeIcon, Trees, Hotel, Waves, Briefcase, Map, Store, MoreHorizontal } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import FeaturedListings from '../components/FeaturedListings';
import { Helmet } from 'react-helmet-async';
import { bdLocations } from '../data/locations';

import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { PopInSection } from '../utils/animations';
import { useAnimationSafe } from '../hooks/useAnimationSafe';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { slideFromLeft, slideFromRight } from '../lib/motion';

// ── Variants (defined outside component per Framer Motion skill rules) ───────
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
};

const textVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 80, damping: 20 },
    },
};

const searchBarVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
};

const stickySearchEnter = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.15 } },
};

export default function Home() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [hasUnread, setHasUnread] = useState(false);
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const isDesktop = useIsDesktop();
    const shouldAnimate = useAnimationSafe();
    const prefersReducedMotion = useReducedMotion();

    // ── Sticky search bar state ──────────────────────────────────────────────
    const searchBarRef = useRef(null);
    const [isSearchSticky, setIsSearchSticky] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, 'change', useCallback((latest) => {
        if (!searchBarRef.current) return;
        const rect = searchBarRef.current.getBoundingClientRect();
        // Trigger sticky when the search bar's top edge scrolls past the viewport top
        // On mobile, account for the safe area; on desktop, account for the 80px header
        const threshold = isDesktop ? 80 : 0;
        // Get the element's offset from the top of the page
        const offsetTop = searchBarRef.current.offsetTop;
        setIsSearchSticky(latest > offsetTop - threshold);
    }, [isDesktop]));

    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            where('isRead', '==', false)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHasUnread(!snapshot.empty);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const [searchTerm, setSearchTerm] = useState('');
    
    const handleSearch = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        navigate('/search', { state: { division: selectedDivision, searchTerm } });
    };

    return (
        <div className="pb-24 bg-[#F8F9FA] dark:bg-[#0F1117] min-h-screen relative overflow-hidden">
            <Helmet>
                <title>Any-Let | The Smartest Way to Rent in Bangladesh</title>
                <meta name="description" content="Discover verified properties for rent in Dhaka, Chittagong, and across Bangladesh. Connect with trusted landlords securely on Any-Let." />
            </Helmet>

            {/* ── Mobile Header ─────────────────────────────────────────────── */}
            <header className="flex md:hidden items-center px-4 pt-3 pb-4 justify-between">
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
                                className="appearance-none bg-transparent text-slate-900 dark:text-slate-100 text-sm font-black leading-tight outline-none cursor-pointer pr-4 z-10"
                            >
                                <option value="">All Bangladesh</option>
                                {Object.keys(bdLocations).map(div => (
                                    <option key={div} value={div}>{div}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="text-primary dark:text-indigo-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link to="/notifications" className="relative flex size-10 items-center justify-center rounded-xl bg-white dark:bg-[#1A1D24] text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-white/[0.06] transition-transform active:scale-95">
                        <Bell size={20} />
                        {hasUnread && (
                            <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#1A1D24]" />
                        )}
                    </Link>
                </div>
            </header>

            {/* ── Sticky Search Bar (appears when inline bar scrolls out of view) ── */}
            <AnimatePresence>
                {isSearchSticky && (
                    <motion.div
                        key="sticky-search"
                        {...(prefersReducedMotion ? {} : stickySearchEnter)}
                        className="fixed left-0 right-0 z-40 bg-white/80 dark:bg-[#0F1117]/85 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.06] shadow-lg shadow-slate-200/30 dark:shadow-none"
                        style={{ top: isDesktop ? '80px' : 'env(safe-area-inset-top, 0px)' }}
                    >
                        <div className="max-w-[1400px] mx-auto px-4 lg:px-16 py-2.5">
                            <form 
                                onSubmit={handleSearch}
                                className="flex w-full items-center rounded-2xl h-12 bg-white dark:bg-[#1A1D24] shadow-md border border-slate-100 dark:border-white/[0.06] overflow-hidden group focus-within:border-primary/30 dark:focus-within:border-indigo-500/30 transition-colors"
                            >
                                <div className="text-slate-400 flex items-center justify-center pl-4 group-focus-within:text-primary dark:group-focus-within:text-indigo-400 transition-colors">
                                    <Search size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('search_placeholder')}
                                    className="flex-1 bg-transparent px-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none truncate"
                                    aria-label={t('search_placeholder')}
                                />
                                {/* Desktop: show location chip inside the sticky bar */}
                                <div className="hidden md:flex items-center gap-1.5 pr-2">
                                    <MapPin size={14} className="text-primary dark:text-indigo-400" />
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{selectedDivision || 'All Bangladesh'}</span>
                                </div>
                                <div className="flex items-center pr-2">
                                    <button 
                                        type="submit"
                                        className="bg-primary text-white h-9 px-4 rounded-xl flex items-center justify-center shadow-md shadow-primary/20 hover:scale-105 transition-transform"
                                        aria-label="Search"
                                    >
                                        <SlidersHorizontal size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-7xl mx-auto lg:max-w-none">
                <div className="px-4 py-6 md:py-12 lg:flex lg:flex-row lg:items-center lg:justify-between lg:min-h-[580px] lg:py-0 lg:px-16 lg:gap-16 lg:max-w-[1400px] lg:mx-auto">
                    <motion.div 
                        variants={shouldAnimate && isDesktop ? slideFromLeft : containerVariants}
                        initial="hidden"
                        animate={shouldAnimate && isDesktop ? "show" : "visible"}
                        className="flex flex-col gap-6 md:gap-10 lg:items-start lg:flex-1 lg:text-left w-full"
                    >
                        <motion.h1 
                            variants={textVariants}
                            className="text-3xl md:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white max-w-2xl will-change-transform transform-gpu lg:text-5xl lg:max-w-[540px]"
                        >
                            {t('hero_title')} <span className="text-primary dark:text-indigo-400 italic">{t('hero_perfect')}</span> {t('hero_space')} <span className="underline decoration-primary decoration-4 underline-offset-8">{t('hero_seconds')}</span>.
                        </motion.h1>

                        {/* ── Inline Search Bar (ref tracked for sticky trigger) ──── */}
                        <motion.div
                            ref={searchBarRef}
                            variants={searchBarVariants}
                            className="will-change-transform transform-gpu"
                        >
                            <div className="flex flex-col w-full max-w-4xl">
                                <div className="flex w-full items-stretch rounded-3xl h-16 md:h-20 bg-white dark:bg-[#1A1D24] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/[0.06] overflow-hidden group">
                                    <div className="hidden md:flex items-center border-r border-slate-100 dark:border-white/[0.06] pl-6 pr-2 relative">
                                        <MapPin size={20} className="text-primary dark:text-indigo-400 mr-2" />
                                        <select 
                                            value={selectedDivision}
                                            onChange={(e) => setSelectedDivision(e.target.value)}
                                            className="appearance-none bg-transparent text-slate-900 dark:text-white font-bold outline-none cursor-pointer pr-6"
                                            aria-label="Location"
                                        >
                                            <option value="">Anywhere</option>
                                            {Object.keys(bdLocations).map(div => (
                                                <option key={div} value={div}>{div}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                    <form 
                                        onSubmit={handleSearch}
                                        className="flex-1 flex items-stretch transition-colors"
                                    >
                                        <div className="text-slate-400 flex items-center justify-center pl-6 group-focus-within:text-primary dark:text-indigo-400 transition-colors">
                                            <Search size={26} />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
                                            placeholder={t('search_placeholder')}
                                            className="w-full bg-transparent px-4 text-lg font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                                            aria-label={t('search_placeholder')}
                                        />
                                    </form>
                                    <div className="flex items-center pr-3">
                                        <button
                                            type="button"
                                            onClick={handleSearch}
                                            className="bg-primary text-white h-12 md:h-14 px-6 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                                            aria-label="Search"
                                        >
                                            <span className="hidden md:inline mr-2 font-bold">{t('search')}</span>
                                            <SlidersHorizontal size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right — Hero illustration (desktop only) */}
                    <motion.div
                        className="hidden lg:block lg:flex-1 lg:max-w-[560px]"
                        variants={shouldAnimate && isDesktop ? slideFromRight : {}}
                        initial="hidden"
                        animate="show"
                    >
                        <img
                            src="/hero-illustration.png"
                            alt="Property listings in Bangladesh"
                            className="w-full h-auto object-contain drop-shadow-xl"
                            loading="eager"
                            fetchPriority="high"
                        />
                    </motion.div>
                </div>

                <PopInSection delay={0.05} className="mt-12 lg:max-w-[1400px] lg:mx-auto lg:px-16 lg:mt-20">
                    <div className="flex items-center justify-between px-4 mb-6 lg:px-0">
                        <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight">{t('categories')}</h3>
                    </div>
                    <div className="flex gap-6 px-4 overflow-x-auto no-scrollbar pb-4 lg:px-0 lg:flex-wrap lg:justify-center">
                        <CategoryItem icon={<HomeIcon size={28} />} label="All" active={selectedCategory === 'All'} onClick={() => setSelectedCategory('All')} />
                        <CategoryItem icon={<Building2 size={28} />} label="Apartment" active={selectedCategory === 'Apartment'} onClick={() => setSelectedCategory('Apartment')} />
                        <CategoryItem icon={<Bed size={28} />} label="Room" active={selectedCategory === 'Room'} onClick={() => setSelectedCategory('Room')} />
                        <CategoryItem icon={<Users size={28} />} label="Sublet" active={selectedCategory === 'Sublet'} onClick={() => setSelectedCategory('Sublet')} />
                        <CategoryItem icon={<DoorOpen size={28} />} label="Mess" active={selectedCategory === 'Mess'} onClick={() => setSelectedCategory('Mess')} />
                        <CategoryItem icon={<HomeIcon size={28} />} label="House" active={selectedCategory === 'House'} onClick={() => setSelectedCategory('House')} />
                        <CategoryItem icon={<Trees size={28} />} label="Cottage" active={selectedCategory === 'Cottage'} onClick={() => setSelectedCategory('Cottage')} />
                        <CategoryItem icon={<Hotel size={28} />} label="Hotel" active={selectedCategory === 'Hotel'} onClick={() => setSelectedCategory('Hotel')} />
                        <CategoryItem icon={<Waves size={28} />} label="Resort" active={selectedCategory === 'Resort'} onClick={() => setSelectedCategory('Resort')} />
                        <CategoryItem icon={<Briefcase size={28} />} label="Commercial Space" active={selectedCategory === 'Commercial Space'} onClick={() => setSelectedCategory('Commercial Space')} />
                        <CategoryItem icon={<Map size={28} />} label="Land" active={selectedCategory === 'Land'} onClick={() => setSelectedCategory('Land')} />
                        <CategoryItem icon={<Store size={28} />} label="Shop" active={selectedCategory === 'Shop'} onClick={() => setSelectedCategory('Shop')} />
                        <CategoryItem icon={<MoreHorizontal size={28} />} label="Others" active={selectedCategory === 'Others'} onClick={() => setSelectedCategory('Others')} />
                    </div>
                </PopInSection>

                <PopInSection delay={0.1} className="mt-8 lg:max-w-[1400px] lg:mx-auto lg:px-16">
                    <FeaturedListings category={selectedCategory} division={selectedDivision} />
                </PopInSection>
            </main>
        </div>
    );
}

function CategoryItem({ icon, label, active = false, onClick }) {
    return (
        <motion.button
            onClick={onClick}
            className="flex flex-col items-center gap-2 min-w-[80px]"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
            <div 
                className={`size-16 rounded-2xl flex items-center justify-center transition-all ${active
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                : 'bg-white dark:bg-[#1A1D24] text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/[0.06] shadow-sm hover:shadow-md hover:border-primary/20'
                }`}>
                {icon}
            </div>
            <p className={`text-[11px] font-black uppercase tracking-wider transition-colors ${active ? 'text-primary dark:text-indigo-400' : 'text-slate-500 group-hover:text-slate-700'}`}>{label}</p>
        </motion.button>
    );
}

