import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const UploadPage = lazy(() => import('@/pages/UploadPage'));
const PlayPage = lazy(() => import('@/pages/PlayPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

function PageFallback() {
 return <div className="flex items-center justify-center h-screen">加载中...</div>;
}

function AnimatedRoutes() {
 const location = useLocation();
 return (
 <AnimatePresence mode="wait">
 <motion.div
 key={location.pathname}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.3 }}
 >
 <Routes location={location}>
 <Route path="/login" element={<LoginPage />} />
 <Route element={<AppLayout />}>
 <Route path="/" element={<HomePage />} />
 <Route path="/play/:songId" element={<PlayPage />} />
 <Route path="/upload" element={<UploadPage />} />
 <Route path="/profile" element={<ProfilePage />} />
 </Route>
 </Routes>
 </motion.div>
 </AnimatePresence>
 );
}

export default function App() {
 return (
 <BrowserRouter>
 <Suspense fallback={<PageFallback />}>
 <AnimatedRoutes />
 </Suspense>
 </BrowserRouter>
 );
}
