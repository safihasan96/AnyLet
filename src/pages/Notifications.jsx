import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';
import { cn } from '../lib/cn';
import Container from '../components/layout/Container';
import { Card, Button, Icon, EmptyState, Skeleton } from '../components/ui';

const TYPE_META = {
  request_received: { icon: 'messages', tone: 'info' },
  booking_confirmed: { icon: 'payments', tone: 'success' },
  property_approved: { icon: 'verified', tone: 'primary' },
  review_received: { icon: 'rating', tone: 'warning' },
  system: { icon: 'info', tone: 'neutral' },
};
const TONE_TILE = {
  info: 'bg-info-subtle text-info',
  success: 'bg-success-subtle text-success',
  primary: 'bg-primary-subtle text-primary',
  warning: 'bg-warning-subtle text-warning',
  neutral: 'bg-surface-sunken text-muted',
};

export default function Notifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (notif) => {
    if (!notif.isRead) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
      } catch (err) {
        logger.error('Error marking notification as read:', err);
      }
    }
    if (notif.link) navigate(notif.link);
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter((n) => !n.isRead);
    if (unreadNotifs.length === 0) return;
    try {
      const batch = writeBatch(db);
      unreadNotifs.forEach((n) => batch.update(doc(db, 'notifications', n.id), { isRead: true }));
      await batch.commit();
    } catch (err) {
      logger.error('Error marking all as read:', err);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Container size="narrow" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
        <header className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-display-md text-content">Notifications</h1>
            <p className="mt-1 text-body-sm text-muted">Requests, approvals, reviews and updates.</p>
          </div>
          {hasUnread && <Button variant="ghost" size="sm" onClick={markAllAsRead} leftIcon={<Icon name="check" />}>Mark all read</Button>}
        </header>

        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" rounded="rounded-card" />)}</div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={<Icon name="notifications" />} title="No notifications yet" description="You’re all caught up. New activity will show up here." />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const meta = TYPE_META[notif.type] || { icon: 'notifications', tone: 'primary' };
              return (
                <Card
                  key={notif.id}
                  as="button" type="button" onClick={() => markAsRead(notif)}
                  className={cn('flex w-full items-start gap-3 text-left transition-colors', notif.isRead ? 'opacity-75' : 'ring-1 ring-primary/15')}
                >
                  <span className={cn('grid size-11 shrink-0 place-items-center rounded-card', notif.isRead ? 'bg-surface-sunken text-subtle' : TONE_TILE[meta.tone])}>
                    <Icon name={meta.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-body-sm', notif.isRead ? 'font-medium text-content' : 'font-semibold text-content')}>{notif.title}</p>
                    <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-muted">{notif.message}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-caption text-subtle">
                      <Icon name="time" className="size-3.5" />
                      {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                  {!notif.isRead && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
