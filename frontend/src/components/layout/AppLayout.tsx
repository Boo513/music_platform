import { Outlet, useLocation } from 'react-router-dom';
import { PlayerBar } from './PlayerBar';
import { AnimatePresence, motion } from 'framer-motion';

export function AppLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <PlayerBar />
    </div>
  );
}
