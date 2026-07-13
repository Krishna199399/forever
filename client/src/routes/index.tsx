import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/lib/api';

// Layout
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FloatingBackground } from '@/animations/FloatingBackground';
import { CommandPalette } from '@/components/common/CommandPalette';

// --- Lazy Page Imports ---
// Each page is split into a separate chunk for smaller initial load time.
const Home = React.lazy(() => import('@/pages/Home'));
const Journey = React.lazy(() => import('@/pages/Journey'));
const Exercise = React.lazy(() => import('@/pages/Exercise'));
const WorkoutDetail = React.lazy(() => import('@/pages/WorkoutDetail'));
const Meals = React.lazy(() => import('@/pages/Meals'));
const MealDetail = React.lazy(() => import('@/pages/MealDetail'));
const Sleep = React.lazy(() => import('@/pages/Sleep'));
const Progress = React.lazy(() => import('@/pages/Progress'));
const ForYou = React.lazy(() => import('@/pages/ForYou'));
const Memories = React.lazy(() => import('@/pages/Memories'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const CaregiverPortal = React.lazy(() => import('@/pages/CaregiverPortal'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

// Page transition wrapper — smooth fade + blur on every route change
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -15, filter: 'blur(5px)' }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="w-full flex-1"
    >
      {children}
    </motion.div>
  );
};

// Minimal loading fallback shown while lazy chunks are fetching
const PageLoader: React.FC = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <motion.div
      animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      className="w-12 h-12 bg-primary-love/10 rounded-full flex items-center justify-center"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary-love">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="currentColor"
        />
      </svg>
    </motion.div>
  </div>
);

export const AppRoutes: React.FC = () => {
  const location = useLocation();

  const lastLoggedRef = React.useRef<{ path: string; time: number }>({ path: '', time: 0 });

  // Auto Audit Activity Logger (Deduplicated)
  useEffect(() => {
    const logActivity = async () => {
      if (location.pathname === '/caregiver-portal') return;

      const now = Date.now();
      // Skip duplicate audit logs for the same route if triggered within 5 seconds
      if (lastLoggedRef.current.path === location.pathname && (now - lastLoggedRef.current.time) < 5000) {
        return;
      }
      lastLoggedRef.current = { path: location.pathname, time: now };

      let pageName = 'Home Page';
      if (location.pathname === '/journey') pageName = 'Journey Page';
      else if (location.pathname === '/exercise') pageName = 'Exercise page';
      else if (location.pathname.startsWith('/workouts/')) pageName = 'Workout details';
      else if (location.pathname === '/meals') pageName = 'Meals page';
      else if (location.pathname.startsWith('/meals/')) pageName = 'Meal details';
      else if (location.pathname === '/sleep') pageName = 'Sleep page';
      else if (location.pathname === '/progress') pageName = 'Progress page';
      else if (location.pathname === '/for-you') pageName = 'For You page';
      else if (location.pathname === '/memories') pageName = 'Memories Scrapbook';
      else if (location.pathname === '/settings') pageName = 'Settings page';

      try {
        await api.post('/api/user/audit', {
          action: `Opened ${pageName}`,
          category: 'Navigation',
          details: `Path: ${location.pathname}`
        });
      } catch (err) {
        console.log('Failed to log navigation audit:', err);
      }
    };
    logActivity();
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col relative z-10 selection:bg-primary-love/20 selection:text-primary-love">
      {/* Dynamic Background Particles */}
      <FloatingBackground />

      {/* Global Command Palette Finder */}
      <CommandPalette />

      {/* Header Navigation */}
      <Navbar />

      {/* Spacing for Desktop Navbar */}
      <div className="h-28 hidden md:block" />

      {/* Main Content View with Page Transitions */}
      <main className="flex-1 flex flex-col relative z-20 pb-16 md:pb-6">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/journey" element={<PageWrapper><Journey /></PageWrapper>} />
              <Route path="/exercise" element={<PageWrapper><Exercise /></PageWrapper>} />
              <Route path="/workouts/:slug" element={<PageWrapper><WorkoutDetail /></PageWrapper>} />
              <Route path="/meals" element={<PageWrapper><Meals /></PageWrapper>} />
              <Route path="/meals/:slug" element={<PageWrapper><MealDetail /></PageWrapper>} />
              <Route path="/sleep" element={<PageWrapper><Sleep /></PageWrapper>} />
              <Route path="/progress" element={<PageWrapper><Progress /></PageWrapper>} />
              <Route path="/for-you" element={<PageWrapper><ForYou /></PageWrapper>} />
              <Route path="/memories" element={<PageWrapper><Memories /></PageWrapper>} />
              <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
              <Route path="/caregiver-portal" element={<PageWrapper><CaregiverPortal /></PageWrapper>} />
              {/* 404 Catch-all */}
              <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      {/* Footer Navigation (Static + Mobile Sticky Tab Bar) */}
      <Footer />
    </div>
  );
};
