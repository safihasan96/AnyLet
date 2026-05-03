import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Plus, Building2, MessageSquare, ChevronRight, Activity, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard() {
    const { currentUser: user } = useAuth();
    const navigate = useNavigate();

    const [listings, setListings] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('properties');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Unified property query - fetch all where user might be the owner and filter in JS
        const listingsQuery = query(collection(db, 'properties'));
        const unsubscribeListings = onSnapshot(listingsQuery, (snapshot) => {
            const userListings = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        image: data.image || data.imageUrl || (data.images && data.images[0]),
                        isApproved: data.isApproved !== false
                    };
                })
                .filter(item => (
                    item.ownerId === user.uid ||
                    item.landlordId === user.uid ||
                    item.userId === user.uid ||
                    item.creatorId === user.uid
                ))
                .sort((a, b) => {
                    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                    return timeB - timeA;
                });
            setListings(userListings);
            setLoading(false);
        });

        const requestsQuery = query(collection(db, 'viewing_requests'), where('ownerId', '==', user.uid));
        const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
            setReceivedRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeListings();
            unsubscribeRequests();
        };
    }, [user, navigate]);

    if (loading) return <div className="p-20 text-center animate-pulse">Loading Your Dashboard...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
            <header className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Dashboard</h1>
                    <button onClick={() => navigate('/profile')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                        <Settings size={20} />
                    </button>
                </div>

                <Link to="/profile" className="block active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-4 bg-primary/5 dark:bg-primary/10 p-4 rounded-3xl border border-primary/10">
                        <div className="size-16 rounded-2xl overflow-hidden shadow-lg shadow-primary/20">
                            <img className="w-full h-full object-cover" src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=E0E7FF&color=1A227F&bold=true`} alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-black text-xl text-slate-900 dark:text-white truncate">{user.displayName || "Welcome Back!"}</h2>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest truncate">{user.email}</p>
                        </div>
                        <ChevronRight size={20} className="text-primary/40 mr-2" />
                    </div>
                </Link>
            </header>

            <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <StatCard icon={<Building2 size={24} />} label="Listings" value={listings.length} color="bg-primary" />
                    <StatCard icon={<MessageSquare size={24} />} label="Requests" value={receivedRequests.length} color="bg-emerald-500" />
                </div>

                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
                    <TabButton active={activeTab === 'properties'} label="My Properties" onClick={() => setActiveTab('properties')} />
                    <TabButton active={activeTab === 'requests'} label="Recent Inquiries" onClick={() => setActiveTab('requests')} />
                </div>

                <div className="space-y-4">
                    {activeTab === 'properties' ? (
                        listings.length > 0 ? (
                            listings.map(listing => (
                                <DashboardItem
                                    key={listing.id}
                                    title={listing.title}
                                    subtitle={`${listing.upazila || listing.area || "Dhaka"}`}
                                    image={listing.image || listing.imageUrl}
                                    price={`৳${listing.rent?.toLocaleString()}`}
                                    onClick={() => navigate(`/property/${listing.id}`)}
                                />
                            ))
                        ) : (
                            <EmptyState message="You haven't posted any ads yet." action="/post-ad" actionLabel="Post New Ad" />
                        )
                    ) : (
                        receivedRequests.length > 0 ? (
                            receivedRequests.map(req => (
                                <DashboardItem
                                    key={req.id}
                                    title={req.propertyName || "Inquiry"}
                                    subtitle={`From: ${req.tenantName || req.tenantDetails?.name || "Guest"}`}
                                    image={req.propertyImage}
                                    status={req.status}
                                    onClick={() => navigate(`/requests/${req.id}`)}
                                />
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-400 font-bold">No inquiry requests received yet.</div>
                        )
                    )}
                </div>
            </div>

            <Link to="/post-ad" className="fixed bottom-24 right-6 size-16 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center transition-transform active:scale-90 z-20">
                <Plus size={32} />
            </Link>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-3">
            <div className={`${color} text-white size-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{value}</p>
            </div>
        </div>
    );
}

function TabButton({ active, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${active ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
        >
            {label}
        </button>
    );
}

function DashboardItem({ title, subtitle, image, price, status, onClick }) {
    return (
        <button onClick={onClick} className="w-full text-left flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-50 dark:border-slate-700 shadow-sm active:scale-[0.98] transition-transform">
            <div className="size-16 rounded-xl overflow-hidden shrink-0">
                <img className="w-full h-full object-cover" src={image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&q=80'} alt="" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 dark:text-white truncate">{title}</h4>
                <p className="text-xs font-bold text-slate-500 truncate">{subtitle}</p>
            </div>
            <div className="px-2">
                {price ? (
                    <span className="font-black text-primary text-sm whitespace-nowrap">{price}</span>
                ) : (
                    <div className={`px-2 py-1 rounded-md text-[90%] font-black uppercase tracking-tighter ${status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {status || 'New'}
                    </div>
                )}
            </div>
            <ChevronRight size={18} className="text-slate-300" />
        </button>
    );
}

function EmptyState({ message, action, actionLabel }) {
    return (
        <div className="py-12 px-6 text-center space-y-4">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Activity size={40} />
            </div>
            <p className="text-slate-500 font-bold">{message}</p>
            <Link to={action} className="inline-block bg-primary text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs">
                {actionLabel}
            </Link>
        </div>
    );
}
