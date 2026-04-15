import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext';
import { useAlgorand } from './context/AlgorandContext';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy Loaded Pages
const Landing = lazy(() => import('./pages/public/Landing').then(m => ({ default: m.Landing })));
const AuthPortal = lazy(() => import('./pages/auth/AuthPortal').then(m => ({ default: m.AuthPortal })));
const PublicExplore = lazy(() => import('./pages/public/PublicExplore').then(m => ({ default: m.PublicExplore })));
const PublicCertificate = lazy(() => import('./pages/public/PublicCertificate').then(m => ({ default: m.PublicCertificate })));
const VerifyTx = lazy(() => import('./pages/public/VerifyTx').then(m => ({ default: m.VerifyTx })));
const Dashboard = lazy(() => import('./pages/app/Dashboard').then(m => ({ default: m.Dashboard })));
const Scan = lazy(() => import('./pages/app/Scan').then(m => ({ default: m.Scan })));
const History = lazy(() => import('./pages/app/History').then(m => ({ default: m.History })));
const Profile = lazy(() => import('./pages/app/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/app/Settings').then(m => ({ default: m.Settings })));
const Anchor = lazy(() => import('./pages/app/Anchor').then(m => ({ default: m.Anchor })));

const PageLoader = () => (
  <div className="min-h-screen bg-[#05040A] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const { isConnected } = useAlgorand(); 
  
  if (isLoading) return <PageLoader />;
  
  // High-fidelity fix: Allow entry if authenticated OR if wallet is physically connected
  if (!isAuthenticated && !isConnected) return <Navigate to="/" />;
  
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />
        <Route path="/login" element={<AnimatedPage><AuthPortal /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><AuthPortal /></AnimatedPage>} />
        <Route path="/explore" element={<AnimatedPage><PublicExplore /></AnimatedPage>} />
        <Route path="/cert/:txid" element={<AnimatedPage><PublicCertificate /></AnimatedPage>} />
        <Route path="/verify/:txid" element={<AnimatedPage><VerifyTx /></AnimatedPage>} />

        {/* App Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><AnimatedPage><Dashboard /></AnimatedPage></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute><AnimatedPage><Scan /></AnimatedPage></ProtectedRoute>} />
        <Route path="/scan/:id" element={<ProtectedRoute><AnimatedPage><Scan /></AnimatedPage></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><AnimatedPage><History /></AnimatedPage></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AnimatedPage><Profile /></AnimatedPage></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AnimatedPage><Settings /></AnimatedPage></ProtectedRoute>} />
        <Route path="/anchor/:scanId" element={<ProtectedRoute><AnimatedPage><Anchor /></AnimatedPage></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
};

const AnimatedPage = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <AnimatedRoutes />
      </Suspense>
    </Router>
  );
}

export default App;
