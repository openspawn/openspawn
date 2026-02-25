/**
 * Phase Transition Banner — compact slide-down notification when phases change.
 * Non-intrusive: appears below scenario bar, auto-dismisses in 4s.
 */
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [transition, onDismiss]);

  return (
    <AnimatePresence>
      {transition && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-[65] w-[90vw] max-w-md"
          onClick={onDismiss}
        >
          <div className="bg-slate-800/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-lg shadow-cyan-500/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">
                {PHASE_ICONS[transition.phaseIndex] ?? '🎯'}
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-white text-sm tracking-wide">
                  Phase {transition.phaseIndex + 1}: {transition.phaseName}
                </div>
                {transition.epics.length > 0 && (
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {transition.epics.length} new epic{transition.epics.length !== 1 ? 's' : ''}: {transition.epics.slice(0, 2).join(', ')}
                    {transition.epics.length > 2 ? ` +${transition.epics.length - 2} more` : ''}
                  </div>
                )}
              </div>
            </div>
            {/* Progress shimmer */}
            <div className="mt-2 h-0.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 4, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
