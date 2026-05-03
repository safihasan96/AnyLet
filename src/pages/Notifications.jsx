import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Bell, Clock, CheckCircle, ChevronRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'viewing_requests'),
            where('ownerId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort client-side to avoid composite index requirement
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

    const markAsRead = async (id) => {
        try {
            await updateDoc(doc(db, 'viewing_requests', id), { isRead: true });
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
            <header className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
                <button onClick={() => navigate(-1)} className="text-slate-700 dark:text-slate-300 p-2">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
                <div className="w-10 h-10" /> {/* Spacer */}
            </header>

            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                            <Bell size={32} />
                        </div>
                        <p className="font-bold text-slate-500">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => {
                                markAsRead(notif.id);
                                navigate('/requests');
                            }}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${notif.isRead
                                ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-70'
                                : 'bg-white dark:bg-slate-800 border-primary shadow-sm ring-1 ring-primary/10'
                                }`}
                        >
                            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${notif.isRead ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'
                                }`}>
                                <MessageSquare size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm tracking-tight ${notif.isRead ? 'font-medium text-slate-500' : 'font-black text-slate-900 dark:text-white'}`}>
                                    New request for <span className="text-primary">{notif.propertyName}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock size={12} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                    </span>
                                </div>
                            </div>
                            {!notif.isRead && (
                                <div className="size-2.5 bg-primary rounded-full" />
                            )}
                            <ChevronRight size={16} className="text-slate-300" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
