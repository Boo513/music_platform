import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Suspense, lazy } from 'react';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const UploadPage = lazy(() => import('@/pages/UploadPage'));
const PlayPage = lazy(() => import('@/pages/PlayPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const PlaylistPage = lazy(() => import('@/pages/PlaylistPage'));

function PageFallback() {
  return <div className="flex items-center justify-center h-screen">加载中...</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/play/:songId" element={<PlayPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
