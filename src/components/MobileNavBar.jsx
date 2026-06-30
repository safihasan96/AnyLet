import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   PAGE TITLE MAP
   Maps pathname patterns → display title for the mobile top bar.
   Root pages (no back button) have title = null.
───────────────────────────────────────────────────────────────*/
const PAGE_CONFIG = [
  // Root tabs — logo shown, no back button
  { pattern: /^\/$/, title: null },
  { pattern: /^\/search$/, title: null },
  { pattern: /^\/map$/, title: null },
  { pattern: /^\/messages$/, title: null },
  { pattern: /^\/profile$/, title: null },

  // Sub-pages — back button shown
  { pattern: /^\/property\/[^/]+$/, title: 'Property Details' },
  { pattern: /^\/property\/[^/]+\/reviews$/, title: 'Reviews' },
  { pattern: /^\/owner\/[^/]+$/, title: 'Owner Profile' },
  { pattern: /^\/post-ad$/, title: 'Post Ad' },
  { pattern: /^\/edit-profile$/, title: 'Edit Profile' },
  { pattern: /^\/setup-owner-profile$/, title: 'Owner Profile' },
  { pattern: /^\/change-password$/, title: 'Change Password' },
  { pattern: /^\/settings$/, title: 'Settings' },
  { pattern: /^\/notifications$/, title: 'Notifications' },
  { pattern: /^\/favorites$/, title: 'Saved' },
  { pattern: /^\/my-listings$/, title: 'My Listings' },
  { pattern: /^\/my-bookings$/, title: 'My Bookings' },
  { pattern: /^\/my-move-ins$/, title: 'Move-Ins' },
  { pattern: /^\/my-reviews$/, title: 'My Reviews' },
  { pattern: /^\/enquiry$/, title: 'Enquiries' },
  { pattern: /^\/referral$/, title: 'Referrals' },
  { pattern: /^\/messages\/[^/]+$/, title: 'Conversation' },
  { pattern: /^\/messages\/request\/[^/]+$/, title: 'Conversation' },
  { pattern: /^\/report-property\/[^/]+$/, title: 'Report Property' },
  { pattern: /^\/verify-email$/, title: 'Verify Email' },
  { pattern: /^\/onboarding$/, title: 'Onboarding' },
  { pattern: /^\/about$/, title: 'About Us' },
  { pattern: /^\/contact$/, title: 'Contact' },
  { pattern: /^\/pricing$/, title: 'Pricing' },
  { pattern: /^\/download$/, title: 'Download' },
  { pattern: /^\/blog$/, title: 'Blog' },
  { pattern: /^\/blog\/[^/]+$/, title: 'Article' },
  { pattern: /^\/privacy-policy$/, title: 'Privacy Policy' },
  { pattern: /^\/terms$/, title: 'Terms' },
  { pattern: /^\/sitemap$/, title: 'Sitemap' },
];

/* Fallback destinations if there's no browser history to go back to */
const FALLBACK_MAP = {
  '/property': '/search',
  '/owner': '/search',
  '/edit-profile': '/profile',
  '/setup-owner-profile': '/profile',
  '/change-password': '/profile',
  '/settings': '/profile',
  '/notifications': '/profile',
  '/favorites': '/profile',
  '/my-listings': '/profile',
  '/my-bookings': '/profile',
  '/my-move-ins': '/profile',
  '/my-reviews': '/profile',
  '/enquiry': '/profile',
  '/referral': '/profile',
  '/messages': '/messages',
  '/report-property': '/search',
  '/verify-email': '/profile',
  '/onboarding': '/',
  '/post-ad': '/',
};

function getFallback(pathname) {
  for (const [prefix, fallback] of Object.entries(FALLBACK_MAP)) {
    if (pathname.startsWith(prefix)) return fallback;
  }
  return '/';
}

function getPageInfo(pathname) {
  for (const { pattern, title } of PAGE_CONFIG) {
    if (pattern.test(pathname)) return { title };
  }
  // Unmatched = treat as sub-page
  return { title: 'Back' };
}

export default function MobileNavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { title } = getPageInfo(location.pathname);

  const handleBack = () => {
    // Use browser history if available, else fallback
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(getFallback(location.pathname));
    }
  };

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] bg-white/70 dark:bg-[#0F1117]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50"
    >
      <div className="flex items-center h-[56px] px-4 gap-3">
        <motion.button
          id="mobile-back-btn"
          onClick={handleBack}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          aria-label="Go back"
          className="flex items-center justify-center size-9 rounded-2xl bg-primary/10 hover:bg-primary/15 active:bg-primary/20 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-colors shrink-0"
        >
          <ArrowLeft size={20} strokeWidth={2.5} className="text-primary dark:text-indigo-400" />
        </motion.button>

        {title && (
          <motion.h1
            key={location.pathname}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1 text-[16px] font-[900] text-slate-900 dark:text-white tracking-tight truncate"
          >
            {title}
          </motion.h1>
        )}
      </div>
    </header>
  );
}
