import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { subscribeToUnreadCount } from '../utils/messageService';
import { cn } from '../lib/cn';
import { Icon } from './ui';

/**
 * BottomNav — mobile tab bar (translucent, scroll-under) with a floating "Post"
 * action. Fixed to the bottom with safe-area-inset padding; the 4.5rem bar
 * height matches the spacer App.jsx renders. Every tap target is ≥44px. Motion
 * is limited to a shared active-dot indicator + a gentle press on the CTA.
 */
export default function BottomNav() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToUnreadCount(currentUser.uid, setUnread);
    return () => unsub();
  }, [currentUser]);

  // Show 0 when logged out without resetting state inside the effect.
  const shownUnread = currentUser ? unread : 0;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 surface-blur border-t border-border"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      aria-label="Primary"
    >
      <div className="flex h-[4.5rem] items-center justify-evenly px-1 sm:px-6">
        <Tab to="/" icon="explore" label={t('explore')} active={isActive('/')} />
        <Tab to="/map" icon="map" label="Map" active={isActive('/map')} />

        {/* Floating Post action */}
        <div className="relative -top-6 flex w-16 shrink-0 justify-center sm:w-20">
          <motion.div whileTap={{ scale: 0.92 }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }}>
            <Link
              to="/post-ad"
              aria-label="Post an ad"
              className="grid size-14 place-items-center rounded-full bg-primary text-on-primary shadow-raised
                         border-4 border-bg transition-colors hover:bg-primary-hover
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Icon name="add" className="size-6" strokeWidth={2.5} />
            </Link>
          </motion.div>
        </div>

        <Tab to="/messages" icon="messages" label={t('messages')} active={isActive('/messages')} badge={shownUnread} />
        <Tab to="/profile" icon="user" label={t('profile')} active={isActive('/profile')} />
      </div>
    </nav>
  );
}

function Tab({ to, icon, label, active, badge = 0 }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-control px-2 transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        active ? 'text-primary' : 'text-subtle hover:text-content'
      )}
    >
      {active && (
        <motion.span
          layoutId="bottomnav-active"
          className="absolute -top-1 h-1 w-5 rounded-full bg-primary"
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        />
      )}
      <span className="relative">
        <Icon name={icon} className="size-6" strokeWidth={active ? 2.4 : 2} />
        {badge > 0 && (
          <span className="absolute -right-1.5 -top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.625rem] font-semibold leading-4 text-on-danger ring-2 ring-bg">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="text-[0.6875rem] font-medium leading-none">{label}</span>
    </Link>
  );
}
