import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * OnboardingGuard — wraps routes that require full onboarding completion.
 *
 * Props:
 *   requirePhoneVerified  — redirect to /onboarding if phone not verified
 *   requireOnboarded      — redirect to /onboarding if onboarding not complete
 *   showModal             — instead of redirecting, call this fn (for inline prompts)
 */
export default function OnboardingGuard({ children, requirePhoneVerified = false, requireOnboarded = false }) {
    const { currentUser, isOnboarded, isPhoneVerified, onboardingStep } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
    }

    if (requireOnboarded && !isOnboarded) {
        return <Navigate to={`/onboarding?next=${encodeURIComponent(location.pathname)}`} replace />;
    }

    if (requirePhoneVerified && !isPhoneVerified) {
        return <Navigate to={`/onboarding?next=${encodeURIComponent(location.pathname)}`} replace />;
    }

    return children;
}
