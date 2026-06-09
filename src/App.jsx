import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import InstallPrompt from './components/InstallPrompt';
import CustomCursor from './components/CustomCursor';
import Home from './pages/Home';
import Search from './pages/Search';
import PropertyDetails from './pages/PropertyDetails';
import PropertyReviews from './pages/PropertyReviews';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import AddProperty from './pages/AddProperty';
import Favorites from './pages/Favorites';
import Notifications from './pages/Notifications';

import Enquiry from './pages/Enquiry';
import Requests from './pages/Requests';
import Admin from './pages/AdminPanel';
import OwnerProfile from './pages/OwnerProfile';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import EditProfile from './pages/EditProfile';
import MyListings from './pages/MyListings';
import MyMoveIns from './pages/MyMoveIns';
import MyBookings from './pages/MyBookings';
import Download from './pages/Download';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import Sitemap from './pages/Sitemap';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Agents from './pages/Agents';
import AgentProfile from './pages/AgentProfile';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Settings from './pages/Settings';
import ReportProperty from './pages/ReportProperty';
import VerifyEmail from './pages/VerifyEmail';
import ReferralDashboard from './pages/ReferralDashboard';
import MapPage from './pages/MapPage';
import Onboarding from './pages/Onboarding';
import OnboardingGuard from './components/OnboardingGuard';
import './App.css';
import { motion, AnimatePresence } from 'framer-motion';

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  useEffect(() => {
    // Legacy auto-migration removed. Use Admin Panel > System Health for manual cleanup.
  }, []);

  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAuthPath = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className={isAdminPath ? "min-h-screen w-full bg-slate-50 flex" : "app-container relative flex flex-col"}>
      <CustomCursor />
      {!isAdminPath && !isAuthPath && (
        <div className="hidden md:block sticky top-0 z-50">
          <Header />
        </div>
      )}

      <main className={isAdminPath ? 'w-full' : 'flex-1 overflow-x-hidden pt-0'}>
        <div className={isAdminPath || isAuthPath ? '' : 'main-content'}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/search" element={<PageWrapper><Search /></PageWrapper>} />
              <Route path="/property/:id" element={<PageWrapper><PropertyDetails /></PageWrapper>} />
              <Route path="/property/:id/reviews" element={<PageWrapper><PropertyReviews /></PageWrapper>} />
              <Route path="/owner/:id" element={<PageWrapper><OwnerProfile /></PageWrapper>} />
              <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
              <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
              <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
              <Route path="/favorites" element={<PageWrapper><Favorites /></PageWrapper>} />
              <Route path="/download" element={<PageWrapper><Download /></PageWrapper>} />
              <Route path="/about" element={<PageWrapper><AboutUs /></PageWrapper>} />
              <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
              <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
              <Route path="/sitemap" element={<PageWrapper><Sitemap /></PageWrapper>} />
              <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
              <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
              <Route path="/agents" element={<PageWrapper><Agents /></PageWrapper>} />
              <Route path="/agent/:id" element={<PageWrapper><AgentProfile /></PageWrapper>} />
              <Route path="/blog" element={<PageWrapper><Blog /></PageWrapper>} />
              <Route path="/blog/:id" element={<PageWrapper><BlogPost /></PageWrapper>} />
              <Route path="/map" element={<MapPage />} />

              {/* Protected Routes */}
              <Route path="/requests" element={
                <ProtectedRoute>
                  <PageWrapper><Requests /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <PageWrapper><Onboarding /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/post-ad" element={
                <OnboardingGuard requireOnboarded>
                  <PageWrapper><AddProperty /></PageWrapper>
                </OnboardingGuard>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <PageWrapper><Profile /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <PageWrapper><Settings /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <PageWrapper><Notifications /></PageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/edit-profile" element={
                <ProtectedRoute>
                  <PageWrapper><EditProfile /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/verify-email" element={
                <ProtectedRoute>
                  <PageWrapper><VerifyEmail /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/change-password" element={
                <ProtectedRoute>
                  <PageWrapper><ChangePassword /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/my-listings" element={
                <ProtectedRoute>
                  <PageWrapper><MyListings /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/my-move-ins" element={
                <ProtectedRoute>
                  <PageWrapper><MyMoveIns /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute>
                  <PageWrapper><MyBookings /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/enquiry" element={
                <OnboardingGuard requirePhoneVerified>
                  <PageWrapper><Enquiry /></PageWrapper>
                </OnboardingGuard>
              } />
              <Route path="/report-property/:id" element={
                <ProtectedRoute>
                  <PageWrapper><ReportProperty /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/referral" element={
                <ProtectedRoute>
                  <PageWrapper><ReferralDashboard /></PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/admin/*" element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } />
            </Routes>
          </AnimatePresence>
        </div>
      </main>

      {!isAdminPath && !isAuthPath && !location.pathname.startsWith('/property/') && (
        <>
          {/* Spacer to prevent content overlap with fixed bottom nav */}
          <div className="md:hidden h-24" />
          <div className="md:hidden">
            <BottomNav />
          </div>
        </>
      )}
      {/* On /map the BottomNav still shows but map is fixed-position beneath it */}
      <InstallPrompt />
    </div>
  );
}

export default App;
