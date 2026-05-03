import { useState, useEffect } from 'react';
import {
    Users,
    Home,
    ClipboardList,
    TrendingUp,
    CreditCard,
    Briefcase,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeListings: 0,
        pendingRequests: 0,
        todayGrowth: '+4.5%'
    });

    useEffect(() => {
        // Stats listeners
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            setStats(prev => ({ ...prev, totalUsers: snap.size }));
        });
        const unsubProps = onSnapshot(query(collection(db, 'properties'), where('isActive', '==', true)), (snap) => {
            setStats(prev => ({ ...prev, activeListings: snap.size }));
        });
        const unsubReqs = onSnapshot(query(collection(db, 'ViewingRequests'), where('status', '==', 'pending')), (snap) => {
            setStats(prev => ({ ...prev, pendingRequests: snap.size }));
        });

        return () => {
            unsubUsers();
            unsubProps();
            unsubReqs();
        };
    }, []);

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#3f6ad8', bg: 'rgba(63, 106, 216, 0.1)' },
        { label: 'Active Ads', value: stats.activeListings, icon: Home, color: '#3ac47d', bg: 'rgba(58, 196, 125, 0.1)' },
        { label: 'Pending Requests', value: stats.pendingRequests, icon: ClipboardList, color: '#f7b924', bg: 'rgba(247, 185, 36, 0.1)' },
        { label: 'Capital Gains', value: '$563', icon: CreditCard, color: '#d92550', bg: 'rgba(217, 37, 80, 0.1)', growth: '+7.35%' },
    ];

    return (
        <div className="fade-in">
            <div className="admin-page-title">
                <h1>Analytics Dashboard</h1>
                <p>This is an example dashboard created using build-in elements and components.</p>
            </div>

            {/* Variation Tabs Placeholder */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                <button style={{ padding: '0.4rem 1.2rem', borderRadius: '4px', border: 'none', background: '#3f6ad8', color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>Variation 1</button>
                <button style={{ padding: '0.4rem 1.2rem', borderRadius: '4px', border: 'none', background: 'white', color: '#495057', fontWeight: 600, fontSize: '0.8rem', boxShadow: '0 0.125rem 0.625rem rgba(0,0,0,0.1)' }}>Variation 2</button>
            </div>

            {/* Performance Card */}
            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#495057' }}>Portfolio Performance</h2>
                    <button style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #3f6ad8', color: '#3f6ad8', background: 'transparent', fontSize: '0.75rem', fontWeight: 700 }}>View All</button>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#f7b924', color: 'white' }}>
                            <Briefcase size={24} />
                        </div>
                        <div className="stat-details">
                            <p>Cash Deposits</p>
                            <h3>1,7M</h3>
                            <span style={{ color: '#d92550', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                                <ArrowDownLeft size={12} /> 54.1% less earnings
                            </span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#d92550', color: 'white' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-details">
                            <p>Invested Dividends</p>
                            <h3>9M</h3>
                            <span style={{ color: '#3ac47d', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                                <TrendingUp size={12} /> Grow Rate: 14.1%
                            </span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#3ac47d', color: 'white' }}>
                            <Users size={24} />
                        </div>
                        <div className="stat-details">
                            <p>Capital Gains</p>
                            <h3>$563</h3>
                            <span style={{ color: '#3ac47d', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                                <ArrowUpRight size={12} /> Increased by 7.35%
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <button style={{
                        background: '#3f6ad8',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 2.5rem',
                        borderRadius: '30px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 0.125rem 0.625rem rgba(63, 106, 216, 0.3)'
                    }}>
                        View Complete Report
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Technical Support SVG Chart */}
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#3ac47d' }}>☁️</span> Technical Support
                        </h2>
                        <MoreHorizontal size={20} color="#adb5bd" />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase' }}>New Accounts Since 2018</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0.5rem 0' }}>
                            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>78%</span>
                            <span style={{ color: '#3ac47d', fontWeight: 700, fontSize: '0.9rem' }}>+14</span>
                        </div>
                    </div>

                    <div style={{ height: '150px', position: 'relative' }}>
                        <svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3ac47d" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#3ac47d" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0 80 Q 50 20, 100 70 T 200 60 T 300 30 T 400 50 L 400 100 L 0 100 Z"
                                fill="url(#chartGradient)"
                            />
                            <path
                                d="M0 80 Q 50 20, 100 70 T 200 60 T 300 30 T 400 50"
                                fill="none"
                                stroke="#3ac47d"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <circle cx="300" cy="30" r="4" fill="white" stroke="#3ac47d" strokeWidth="2" />
                        </svg>
                    </div>

                    <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #f1f4f6', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase' }}>Total Orders</p>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: '#adb5bd' }}>Last year expenses</p>
                            </div>
                            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3ac47d' }}>$ 1896</span>
                        </div>
                        <div style={{ height: '4px', background: '#f1f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: '65%', height: '100%', background: '#3f6ad8' }}></div>
                        </div>
                    </div>
                </div>

                {/* Timeline Component */}
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#d92550' }}>⌛</span> Timeline Example
                        </h2>
                        <MoreHorizontal size={20} color="#adb5bd" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                            { color: '#f7b924', text: 'All Hands Meeting', time: '10:00 AM' },
                            { color: '#d92550', text: 'Yet another one', time: '15:00 PM' },
                            { color: '#3ac47d', text: 'Build the production release', badge: 'NEW' },
                            { color: '#3f6ad8', text: 'Something not important', avatars: true },
                        ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    border: `3px solid ${item.color}`,
                                    flexShrink: 0,
                                    zIndex: 1,
                                    marginTop: '4px'
                                }}></div>
                                {idx < 3 && <div style={{
                                    position: 'absolute',
                                    left: '4.5px',
                                    top: '16px',
                                    bottom: '-16px',
                                    width: '3px',
                                    background: '#f1f4f6'
                                }}></div>}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.text}</span>
                                        {item.badge && <span style={{ background: '#d92550', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>{item.badge}</span>}
                                    </div>
                                    {item.time && <span style={{ fontSize: '0.75rem', color: '#adb5bd' }}>at {item.time}</span>}
                                    {item.avatars && (
                                        <div style={{ display: 'flex', marginTop: '8px' }}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    background: '#3f6ad8',
                                                    border: '2px solid white',
                                                    marginLeft: i === 1 ? 0 : -8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700
                                                }}>U{i}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                        <button style={{
                            background: '#343a40',
                            color: 'white',
                            border: 'none',
                            padding: '0.6rem 2rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                        }}>
                            View All Messages
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Row Stats */}
            <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
                {statCards.map((card, idx) => (
                    <div key={idx} className="admin-card" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="stat-icon" style={{ background: card.bg, color: card.color, width: 42, height: 42 }}>
                                <card.icon size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase' }}>{card.label}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{card.value}</h3>
                                    {card.growth && <span style={{ color: '#3ac47d', fontSize: '0.7rem', fontWeight: 700 }}>{card.growth}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
