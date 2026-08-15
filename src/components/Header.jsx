import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { subscribeToUnreadCount } from '../utils/messageService';
import logger from '../utils/logger';
import { Navbar, NavLink } from './layout';
import {
  Button, IconButton, Avatar, Badge, Icon,
  Dropdown, DropdownItem, DropdownLabel, DropdownSeparator,
} from './ui';

/**
 * Header — desktop top chrome (rendered only ≥md by App.jsx). Built on the
 * Navbar primitive (translucent, scroll-under, scroll-edge elevation). Theme is
 * read/toggled through ThemeContext ONLY — the old localStorage('theme') toggle
 * that fought ThemeContext('app-theme') has been removed (single source of truth).
 */
const NAV = [
  { to: '/', label: 'Explore' },
  { to: '/map', label: 'Map' },
  { to: '/messages', label: 'Messages' },
  { to: '/profile', label: 'Profile' },
];

export default function Header() {
  const { currentUser, logout, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const unsubMsg = subscribeToUnreadCount(currentUser.uid, setUnreadMsgs);
    const qNotif = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('isRead', '==', false)
    );
    const unsubNotif = onSnapshot(qNotif, (snap) => setUnreadNotifs(snap.size));
    return () => {
      unsubMsg();
      unsubNotif();
    };
  }, [currentUser]);

  // Counts only render inside the logged-in branch; guard the always-visible
  // nav dot so a stale value can't linger after logout.
  const hasUnread = !!currentUser && (unreadMsgs > 0 || unreadNotifs > 0);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      logger.error('Failed to log out', error);
    }
  };

  const themeToggle = (
    <IconButton
      label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      variant="ghost"
      onClick={toggleTheme}
    >
      <Icon name={theme === 'dark' ? 'themeLight' : 'themeDark'} />
    </IconButton>
  );

  const logo = (
    <Link to="/" className="flex items-center gap-2.5 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <span className="grid size-9 place-items-center rounded-control bg-primary text-on-primary shadow-card">
        <Icon name="apartment" className="size-5" />
      </span>
      <span className="font-display text-title-md tracking-tight text-content">
        any<span className="text-primary italic">.let</span>
      </span>
    </Link>
  );

  const end = currentUser ? (
    <>
      {currentUser.emailVerified ? (
        <Button as={Link} to="/post-ad" size="sm" leftIcon={<Icon name="add" />} className="hidden lg:inline-flex">
          Post Ad
        </Button>
      ) : (
        <Button variant="danger" size="sm" leftIcon={<Icon name="verified" />} onClick={() => navigate('/verify-email')} className="hidden lg:inline-flex">
          Verify
        </Button>
      )}
      {themeToggle}
      <div className="relative">
        <IconButton label="Notifications" variant="ghost" as={Link} to="/notifications">
          <Icon name="notifications" />
        </IconButton>
        {unreadNotifs > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" aria-hidden="true" />
        )}
      </div>
      <Dropdown
        align="end"
        trigger={
          <button className="flex items-center gap-2 rounded-pill p-1 pr-2.5 transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <Avatar name={userProfile?.fullName || currentUser.email} size="sm" />
            <span className="hidden max-w-[120px] truncate text-body-sm font-medium text-content xl:block">
              {userProfile?.fullName || currentUser.email}
            </span>
            <Icon name="chevronDown" className="size-4 text-subtle" />
          </button>
        }
      >
        <DropdownLabel>{userProfile?.role || 'Account'}</DropdownLabel>
        <DropdownItem icon={<Icon name="document" />} onSelect={() => navigate('/my-listings')}>My Ads</DropdownItem>
        <DropdownItem
          icon={<Icon name="messages" />}
          trailing={unreadMsgs > 0 ? <Badge tone="primary" size="sm">{unreadMsgs}</Badge> : null}
          onSelect={() => navigate('/messages')}
        >
          Messages
        </DropdownItem>
        <DropdownItem
          icon={<Icon name="notifications" />}
          trailing={unreadNotifs > 0 ? <Badge tone="primary" size="sm">{unreadNotifs}</Badge> : null}
          onSelect={() => navigate('/notifications')}
        >
          Notifications
        </DropdownItem>
        <DropdownItem icon={<Icon name="user" />} onSelect={() => navigate('/profile')}>My Profile</DropdownItem>
        <DropdownItem icon={<Icon name="favorite" />} onSelect={() => navigate('/favorites')}>Saved</DropdownItem>
        {userProfile?.role === 'admin' && (
          <DropdownItem icon={<Icon name="verified" />} onSelect={() => navigate('/admin')}>Admin Panel</DropdownItem>
        )}
        <DropdownSeparator />
        <DropdownItem icon={<Icon name="logout" />} tone="danger" onSelect={handleLogout}>Log out</DropdownItem>
      </Dropdown>
    </>
  ) : (
    <>
      {themeToggle}
      <Button as={Link} to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">Log in</Button>
      <Button as={Link} to="/signup" size="sm">Join Now</Button>
    </>
  );

  const center = NAV.map((item) => (
    <NavLink key={item.to} to={item.to} active={location.pathname === item.to}>
      <span className="relative">
        {item.label}
        {item.to === '/messages' && hasUnread && (
          <span className="absolute -right-2.5 -top-0.5 size-2 rounded-full bg-danger" aria-hidden="true" />
        )}
      </span>
    </NavLink>
  ));

  return <Navbar start={logo} end={end}>{center}</Navbar>;
}
