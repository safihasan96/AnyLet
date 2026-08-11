import { NavLink } from 'react-router-dom';
import {
    Users, ClipboardList, Search, LayoutDashboard, Settings, LogOut, ShieldCheck,
    ChevronRight, ChevronLeft, Menu, Building2, MessageSquare, Flag,
    CreditCard, Banknote, Star, FileCheck, Receipt, Lock,
} from 'lucide-react';

const NAV_ITEMS = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { path: '/admin/users', icon: Users, label: 'Platform Users' },
    { path: '/admin/properties', icon: Building2, label: 'Properties' },
    { path: '/admin/requests', icon: ClipboardList, label: 'Live Pipeline' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments & Escrow' },
    { path: '/admin/payment-details', icon: Receipt, label: 'Payment Details' },
    { path: '/admin/enquiries', icon: MessageSquare, label: 'Enquiries' },
    { path: '/admin/reviews', icon: Star, label: 'Reviews' },
    { path: '/admin/kyc', icon: FileCheck, label: 'KYC Verification' },
    { path: '/admin/reports', icon: Flag, label: 'Reports' },
    { path: '/admin/chat-review', icon: Search, label: 'Chat Review' },
    { path: '/admin/claims', icon: Lock, label: 'Admin Access' },
    { path: '/admin/settings', icon: Settings, label: 'System Health' },
    { path: '/admin/fees', icon: Banknote, label: 'Fees Config' },
];

/**
 * AdminSidebar — collapsible navigation rail for the admin panel: brand,
 * NavLinks (with live count badges), and the signed-in admin footer.
 * Presentational; counts + handlers come from the AdminPanel shell.
 */
export default function AdminSidebar({
    isCollapsed,
    onToggleCollapse,
    currentUser,
    onLogout,
    pendingListings,
    unresolvedEnquiries,
    reportsCount,
}) {
    return (
        <aside
            className={`
                relative flex-shrink-0 flex flex-col
                ${isCollapsed ? 'w-20' : 'w-64'}
                bg-zinc-950 text-white h-full
                transition-all duration-300 ease-in-out
                shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-30 overflow-hidden
            `}
        >
            {/* Brand + Toggle */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'} py-5 border-b border-zinc-800/60`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.35)] flex-shrink-0">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="text-sm font-black text-white leading-none tracking-tight">Architect</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">Live Control</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200 flex-shrink-0"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Nav */}
            <div className="flex-1 px-2 py-4 overflow-y-auto">
                {!isCollapsed && (
                    <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest px-3 mb-3">Main Core</p>
                )}
                <nav className="space-y-1">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            title={isCollapsed ? item.label : undefined}
                            className={({ isActive }) =>
                                `flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group border-l-4
                                ${isCollapsed ? 'justify-center' : ''}
                                ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500 shadow-[inset_0_0_16px_rgba(16,185,129,0.06)]'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-transparent'
                                }`
                            }
                        >
                            <item.icon size={20} className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && (
                                <>
                                    <span className="font-semibold text-sm">{item.label}</span>
                                    {item.label === 'Properties' && pendingListings > 0 && (
                                        <span className="ml-auto bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                            {pendingListings}
                                        </span>
                                    )}
                                    {item.label === 'Enquiries' && unresolvedEnquiries > 0 && (
                                        <span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                            {unresolvedEnquiries}
                                        </span>
                                    )}
                                    {item.label === 'Reports' && reportsCount > 0 && (
                                        <span className="ml-auto bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                            {reportsCount}
                                        </span>
                                    )}
                                    {item.label !== 'Listings' && (
                                        <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Footer */}
            <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-zinc-800/60`}>
                {isCollapsed ? (
                    <button onClick={onLogout} title="Sign Out"
                        className="flex items-center justify-center w-full p-2.5 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                        <LogOut size={18} />
                    </button>
                ) : (
                    <div className="bg-zinc-900/60 rounded-2xl p-3 border border-zinc-800/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-zinc-300 uppercase text-sm flex-shrink-0">
                                {currentUser?.email?.[0] || 'A'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-black text-white truncate">{currentUser?.email?.split('@')[0]}</p>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">SuperAdmin</p>
                            </div>
                        </div>
                        <button onClick={onLogout}
                            className="flex items-center justify-center w-full gap-2 px-3 py-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl font-bold text-xs transition-all">
                            <LogOut size={13} /> Sign Out
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
