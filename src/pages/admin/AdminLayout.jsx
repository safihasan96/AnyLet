import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, PieChart, Banknote, ShieldAlert, 
    Users, Building2, Settings, Menu, X, LogOut, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDesignSystem.css';
import logger from '../../utils/logger';

const NAV_ITEMS = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { path: '/admin/analytics', icon: PieChart, label: 'Analytics' },
    { path: '/admin/money', icon: Banknote, label: 'Money Management' },
    { path: '/admin/disputes', icon: ShieldAlert, label: 'Disputes' },
    { path: '/admin/chat-review', icon: MessageSquare, label: 'Chat Review' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/listings', icon: Building2, label: 'Listings' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            logger.error('AdminLayout error', e);
        }
    };

    return (
        <div className="admin-datahub flex h-screen overflow-hidden text-[hsl(var(--on-surface))]">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[hsl(var(--surface-container-high))] border-b border-[hsla(0,0%,100%,0.05)] z-50 flex items-center justify-between px-4">
                <div className="font-bold text-lg tracking-tight flex items-center gap-2">
                    <span className="text-[hsl(var(--primary))]">AnyLet</span> Command
                </div>
                <button 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-[hsl(var(--on-surface-variant))] hover:text-[hsl(var(--on-surface))]"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-40 w-64
                bg-[hsl(var(--surface-container-low))] border-r border-[hsla(0,0%,100%,0.05)]
                flex flex-col transform transition-transform duration-300 ease-in-out
                ${mobileMenuOpen ? 'translate-x-0 mt-16' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="hidden md:flex h-16 items-center px-6 border-b border-[hsla(0,0%,100%,0.05)]">
                    <div className="font-bold text-lg tracking-tight flex items-center gap-2">
                        <span className="text-[hsl(var(--primary))]">AnyLet</span> Command
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all
                                ${isActive 
                                    ? 'bg-[hsla(var(--primary),0.15)] text-[hsl(var(--primary))] glass-glow' 
                                    : 'text-[hsl(var(--on-surface-variant))] hover:bg-[hsla(0,0%,100%,0.03)] hover:text-[hsl(var(--on-surface))]'
                                }
                            `}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-[hsla(0,0%,100%,0.05)]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-[hsl(var(--on-surface-variant))] hover:bg-[hsla(var(--error),0.1)] hover:text-[hsl(var(--error))] transition-colors w-full"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-hidden flex flex-col pt-16 md:pt-0 relative">
                {/* Background decorative elements for the glass effect */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[hsla(var(--primary),0.05)] blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-[hsla(var(--success),0.03)] blur-[100px] pointer-events-none" />
                
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm mt-16"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
