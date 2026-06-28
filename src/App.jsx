import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import MobileNavBar from './components/MobileNavBar';
import BottomNav from './components/BottomNav';
import InstallPrompt from './components/InstallPrompt';
import CustomCursor from './components/CustomCursor';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import OnboardingGuard from './components/OnboardingGuard';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────
   LAZY IMPORTS — Each page is its own JS chunk.
   The browser only downloads a chunk when the user navigates
   to that route. This slashes the initial bundle from ~1.4MB
   down to the ~200KB needed just to render the Home page.
   Critical for Bangladesh mobile users on 3G/4G connections.
───────────────────────────────────────────────────────────────*/

// Core (highest traffic — keep import order for visual priority)
const Home            = lazy(() => import('./pages/Home'));
const Search          = lazy(() => import('./pages/Search'));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails'));
const PropertyReviews = lazy(() => import('./pages/PropertyReviews'));
const MyReviews = lazy(() => import('./pages/MyReviews'));
const OwnerProfile    = lazy(() => import('./pages/OwnerProfile'));

// Auth pages
const Login           = lazy(() => import('./pages/Login'));
const Signup          = lazy(() => import('./pages/Signup'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const VerifyEmail     = lazy(() => import('./pages/VerifyEmail'));

// Protected user pages
const Profile         = lazy(() => import('./pages/Account'));
const EditProfile     = lazy(() => import('./pages/EditProfile'));
const SetupOwnerProfile = lazy(() => import('./pages/SetupOwnerProfile'));
const ChangePassword  = lazy(() => import('./pages/ChangePassword'));
const Settings        = lazy(() => import('./pages/Settings'));
const AddProperty     = lazy(() => import('./pages/AddProperty'));
const MyListings      = lazy(() => import('./pages/MyListings'));
const MyBookings      = lazy(() => import('./pages/MyBookings'));
const MyMoveIns       = lazy(() => import('./pages/MyMoveIns'));
const Favorites       = lazy(() => import('./pages/Favorites'));
const Notifications   = lazy(() => import('./pages/Notifications'));
const Inbox           = lazy(() => import('./pages/Inbox'));
const ConversationDetail = lazy(() => import('./pages/ConversationDetail'));
const Enquiry         = lazy(() => import('./pages/Enquiry'));
const ReportProperty  = lazy(() => import('./pages/ReportProperty'));
const ReferralDashboard = lazy(() => import('./pages/ReferralDashboard'));
const Onboarding      = lazy(() => import('./pages/Onboarding'));
const MyPayments      = lazy(() => import('./pages/MyPayments'));

// Map page — Leaflet is very heavy, lazy-loading saves ~250KB on initial load
const MapPage         = lazy(() => import('./pages/MapPage'));

// Public info pages — low traffic, always lazy
const AboutUs         = lazy(() => import('./pages/AboutUs'));
const Contact         = lazy(() => import('./pages/Contact'));
const Pricing         = lazy(() => import('./pages/Pricing'));
const Download        = lazy(() => import('./pages/Download'));
const Blog            = lazy(() => import('./pages/Blog'));
const BlogPost        = lazy(() => import('./pages/BlogPost'));
const Sitemap         = lazy(() => import('./pages/Sitemap'));
const PrivacyPage     = lazy(() => import('./pages/PrivacyPage'));
const Terms           = lazy(() => import('./pages/Terms'));

// Admin — very heavy (127KB), only for admin users
const Admin           = lazy(() => import('./pages/AdminPanel'));

import PageWrapper from './components/layout/PageWrapper';
import { PageSkeleton } from './components/Skeleton';

/* ─────────────────────────────────────────────────────────────
   PAGE LOADING FALLBACK — matches the app's background so
   there's no white flash between route transitions.
───────────────────────────────────────────────────────────────*/
function PageLoader() {
  return <PageSkeleton />;
}

/* ─────────────────────────────────────────────────────────────
   APP ROOT
───────────────────────────────────────────────────────────────*/
function App() {
  const location = useLocation();

  useEffect(() => {
    // Legacy auto-migration removed. Use Admin Panel > System Health for manual cleanup.
  }, []);

  // Strict scroll restoration: scroll to top on every route change, except for the explore page (/)
  useEffect(() => {
    if (location.pathname !== '/') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const isAdminPath = location.pathname.startsWith('/admin');
  const isAuthPath = ['/login', '/signup', '/forgot-password', '/verify-email'].includes(location.pathname);
  const isMapPath = location.pathname === '/map';
  const isConversationPath = location.pathname.startsWith('/messages/') && location.pathname !== '/messages';
  const isInboxPath = location.pathname === '/messages';
  const isExplorePath = location.pathname === '/';
  const isProfilePath = location.pathname === '/profile';
  const isPostAdPath = location.pathname === '/post-ad';

  return (
    <MotionConfig reducedMotion="user">
      <div className={isAdminPath ? 'min-h-screen w-full bg-slate-50 flex' : 'app-container relative flex flex-col'}>
        <CustomCursor />

      {/* Desktop sticky header */}
      {!isAdminPath && !isAuthPath && (
        <div className="hidden md:block sticky top-0 z-50">
          <Header />
        </div>
      )}

      {/* Mobile transparent top nav — shown on all non-admin, non-auth, non-map pages */}
      {!isAdminPath && !isAuthPath && !isMapPath && !isConversationPath && !isInboxPath && !isExplorePath && !isProfilePath && !isPostAdPath && <MobileNavBar />}

      <main className={isAdminPath ? 'w-full' : 'flex-1 overflow-x-hidden pt-0'}>
        {/* pt-14 on mobile = 56px for fixed MobileNavBar; desktop has its own sticky Header */}
        <div className={isAdminPath || isAuthPath || isMapPath || isConversationPath || isInboxPath || isExplorePath || isProfilePath || isPostAdPath ? '' : `main-content ${!isAdminPath && !isAuthPath ? 'md:pt-0' : ''}`}
          style={(!isAdminPath && !isAuthPath && !isMapPath && !isConversationPath && !isInboxPath && !isExplorePath && !isProfilePath && !isPostAdPath) ? { paddingTop: 'calc(56px + env(safe-area-inset-top))' } : undefined}
        >
          {/* Suspense wraps ALL lazy routes — shows PageLoader during chunk download */}
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>

                {/* ── Public Routes ── */}
                <Route path="/"                 element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/search"           element={<PageWrapper><Search /></PageWrapper>} />
                <Route path="/property/:id"     element={<PageWrapper><PropertyDetails /></PageWrapper>} />
                <Route path="/property/:id/reviews" element={<PageWrapper><PropertyReviews /></PageWrapper>} />
                <Route path="/owner/:id"        element={<PageWrapper><OwnerProfile /></PageWrapper>} />
                <Route path="/login"            element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/signup"           element={<PageWrapper><Signup /></PageWrapper>} />
                <Route path="/forgot-password"  element={<PageWrapper><ForgotPassword /></PageWrapper>} />
                <Route path="/favorites"        element={<PageWrapper><Favorites /></PageWrapper>} />
                <Route path="/download"         element={<PageWrapper><Download /></PageWrapper>} />
                <Route path="/about"            element={<PageWrapper><AboutUs /></PageWrapper>} />

                <Route path="/contact"          element={<PageWrapper><Contact /></PageWrapper>} />
                <Route path="/pricing"          element={<PageWrapper><Pricing /></PageWrapper>} />
                <Route path="/sitemap"          element={<PageWrapper><Sitemap /></PageWrapper>} />
                <Route path="/privacy-policy"   element={<PageWrapper><PrivacyPage /></PageWrapper>} />
                <Route path="/terms"            element={<PageWrapper><Terms /></PageWrapper>} />
                <Route path="/blog"             element={<PageWrapper><Blog /></PageWrapper>} />
                <Route path="/blog/:id"         element={<PageWrapper><BlogPost /></PageWrapper>} />
                {/* Map page — Leaflet lazy-loads as its own heavy chunk. ErrorBoundary
                    catches chunk-load failures (common on slow 3G) and shows a retry UI. */}
                <Route path="/map" element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <MapPage />
                    </Suspense>
                  </ErrorBoundary>
                } />

                {/* ── Protected Routes ── */}
                <Route path="/onboarding" element={
                  <ProtectedRoute><PageWrapper><Onboarding /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/post-ad" element={
                  <ProtectedRoute><PageWrapper><AddProperty /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute><PageWrapper><Settings /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute><PageWrapper><Notifications /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/edit-profile" element={
                  <ProtectedRoute><PageWrapper><EditProfile /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/setup-owner-profile" element={
                  <ProtectedRoute><OnboardingGuard><PageWrapper><SetupOwnerProfile /></PageWrapper></OnboardingGuard></ProtectedRoute>
                } />
                <Route path="/verify-email" element={
                  <ProtectedRoute><PageWrapper><VerifyEmail /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/change-password" element={
                  <ProtectedRoute><PageWrapper><ChangePassword /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/my-listings" element={
                  <ProtectedRoute><PageWrapper><MyListings /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/my-move-ins" element={
                  <ProtectedRoute><PageWrapper><MyMoveIns /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/my-bookings" element={
                  <ProtectedRoute><PageWrapper><MyBookings /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/my-reviews" element={
                  <ProtectedRoute><PageWrapper><MyReviews /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute><PageWrapper><Inbox /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/messages/request/:requestId" element={
                  <ProtectedRoute><PageWrapper><ConversationDetail /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/messages/:conversationId" element={
                  <ProtectedRoute><PageWrapper><ConversationDetail /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/enquiry" element={
                  <ProtectedRoute><PageWrapper><Enquiry /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/report-property/:id" element={
                  <ProtectedRoute><PageWrapper><ReportProperty /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/referral" element={
                  <ProtectedRoute><PageWrapper><ReferralDashboard /></PageWrapper></ProtectedRoute>
                } />
                <Route path="/my-payments" element={
                  <ProtectedRoute><PageWrapper><MyPayments /></PageWrapper></ProtectedRoute>
                } />

                {/* ── Admin Routes ── */}
                <Route path="/admin/*" element={
                  <AdminRoute><Admin /></AdminRoute>
                } />

                {/* ── 404 Catch-All ── */}
                <Route path="*" element={
                  <PageWrapper>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                      <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">404</h2>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-6">Page Not Found</p>
                      <Link to="/" className="bg-[#1a227f] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-[#1a227f]/20 transition-all active:scale-95">Go Home</Link>
                    </div>
                  </PageWrapper>
                } />

              </Routes>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      {!isAdminPath && !isAuthPath && !location.pathname.startsWith('/property/') && !isConversationPath && (
        <>
          {/* Spacer to prevent content overlap with fixed bottom nav */}
          <div className="md:hidden h-[calc(4.5rem+max(env(safe-area-inset-bottom),0.5rem))]" />
          <div className="md:hidden">
            <BottomNav />
          </div>
        </>
      )}
      {/* On /map the BottomNav still shows but map is fixed-position beneath it */}
      <InstallPrompt />
      </div>
    </MotionConfig>
  );
}

export default App;
