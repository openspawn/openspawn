/**
 * First-Visit Context Overlay — shows once per session for 10 seconds.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { isSandboxMode } from '../graphql/fetcher';

const STORAGE_KEY = 'openspawn-first-visit-shown';

export function FirstVisitOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isSandboxMode) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!isSandboxMode) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="fixed top-10 left-1/2 -translate-x-1/2 z-[55] px-4 py-2 rounded-full bg-slate-800/90 border border-slate-600/50 backdrop-blur-sm text-sm text-slate-300 whitespace-nowrap max-w-[90vw] truncate"
        >
          You're watching an AI organization handle two client projects simultaneously.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
