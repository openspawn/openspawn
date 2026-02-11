/**
 * Phase Transition Overlay — cinematic full-screen banner when phases change.
 */
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASE_ICONS = ['📋', '⚡', '⚔️', '🚀'];

interface PhaseTransitionProps {
  transition: {
    phaseName: string;
    phaseIndex: number;
    narrative: string;
    epics: string[];
  } | null;
  onDismiss: () => void;
}

export function PhaseTransitionOverlay({ transition, onDismiss }: PhaseTransitionProps) {
  useEffect(() => {
    if (!transition) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [transition, onDismiss]);

  return (
    <AnimatePresence>
      {transition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-md bg-black/60"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center px-6 max-w-lg"
          >
            <div className="text-5xl mb-4">
              {PHASE_ICONS[transition.phaseIndex] ?? '🎯'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide mb-2">
              PHASE {transition.phaseIndex + 1}: {transition.phaseName.toUpperCase()}
            </h1>
            {transition.narrative && (
              <p className="text-slate-300 text-sm sm:text-base mb-4">
                {transition.narrative}
              </p>
            )}
            {transition.epics.length > 0 && (
              <ul className="text-left mx-auto max-w-sm space-y-1 text-sm text-slate-400">
                {transition.epics.map((epic, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{epic}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-600 mt-4">Click to dismiss</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
