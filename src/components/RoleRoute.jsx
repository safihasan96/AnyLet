import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleRoute({ children, allowedRole }) {
    const { currentUser, userRole } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (userRole && userRole !== allowedRole) {
        if (allowedRole === 'admin') {
            // Unprivileged user trying to hit admin
            return <Navigate to="/" replace />;
        }
        if (allowedRole === 'adviser' && userRole === 'client') {
            return <Navigate to="/" state={{ message: 'Access Denied: Landlords only' }} replace />;
        }

        // Redirect to their respective dashboard if they try to access the wrong one
        return <Navigate to={userRole === 'adviser' ? '/dashboard' : '/'} replace />;
    }

    // While userRole is pending fetch, we render null or a loading spinner to prevent flash rendering
    if (currentUser && !userRole) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>Authenticating...</div>
    }

    return children;
}
