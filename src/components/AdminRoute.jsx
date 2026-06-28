import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AdminRoute – wraps any component that should only be visible to admins.
 *
 * Flow:
 *  1. If auth is still loading (userRole not yet fetched), show a centred spinner.
 *  2. If the user is not logged in, redirect to /login.
 *  3. If the user is logged in but role !== 'admin', redirect to /.
 *  4. Otherwise render children.
 */
export default function AdminRoute({ children }) {
    const { currentUser, userRole, loading } = useAuth();

    // 1. Wait if global auth/profile is still loading
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in bg-[#fafafa]">
                <div className="w-12 h-12 border-4 border-zinc-100 border-t-emerald-500 rounded-full animate-spin shadow-xl shadow-emerald-500/10"></div>
                <p className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Verifying Authority Status...</p>
            </div>
        );
    }

    // 2. Not authenticated → go to login
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // 3. Authenticated but role isn't admin
    if (userRole !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // 4. Everything matches! Render children.
    return children;
}
