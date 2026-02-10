import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '../ui/button';
import { useOnboarding } from './onboarding-provider';

export function CompletionCelebration() {
  const { showCelebration, dismissCelebration } = useOnboarding();
  const hasFired = useRef(false);

  useEffect(() => {
    if (showCelebration && !hasFired.current) {
      hasFired.current = true;

      // Fire confetti from both sides
      const defaults = {
        spread: 60,
        ticks: 100,
        gravity: 0.8,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
      };

      confetti({
        ...defaults,
        particleCount: 40,
        origin: { x: 0.2, y: 0.6 },
        angle: 60,
      });
      confetti({
        ...defaults,
        particleCount: 40,
        origin: { x: 0.8, y: 0.6 },
        angle: 120,
      });

      // Second burst
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 30,
          origin: { x: 0.5, y: 0.5 },
          spread: 90,
          startVelocity: 40,
        });
      }, 300);
    }

    if (!showCelebration) {
      hasFired.current = false;
    }
  }, [showCelebration]);

  return (
    <AnimatePresence>
      {showCelebration && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100]"
            onClick={dismissCelebration}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm text-center">
              {/* Celebration icon */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                className="mx-auto mb-6"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <PartyPopper className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              {/* Text */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-2"
              >
                You're ready! 🎉
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-400 mb-8"
              >
                You've got the lay of the ocean floor. Time to dive in and put your agents to work.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={dismissCelebration}
                  size="lg"
                  className="w-full max-w-xs bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-emerald-500/25"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Exploring
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
