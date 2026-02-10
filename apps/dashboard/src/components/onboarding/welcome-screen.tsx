import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Layers, Wallet, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { useOnboarding } from './onboarding-provider';
import { useDemo } from '../../demo/DemoProvider';

const VALUE_PROPS = [
  {
    icon: Layers,
    text: 'Orchestrate agents across tasks and teams',
  },
  {
    icon: Wallet,
    text: 'Set budgets and track credit flow in real-time',
  },
  {
    icon: Eye,
    text: 'Full visibility into every decision and action',
  },
];

export function WelcomeScreen() {
  const { showWelcome, startOnboarding, skipOnboarding } = useOnboarding();
  const { isDemo } = useDemo();

  // In demo mode, DemoWelcome handles the intro — skip the generic welcome
  if (isDemo) return null;

  return (
    <AnimatePresence>
      {showWelcome && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-popover/90 backdrop-blur-md z-[100]"
            onClick={skipOnboarding}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250, delay: 0.1 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md text-center">
              {/* Animated ocean ring */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.2 }}
                className="mx-auto mb-8 relative"
              >
                <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <Bot className="w-12 h-12 text-foreground" />
                </div>
                {/* Pulse rings */}
                <motion.div
                  animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-2xl border-2 border-cyan-400"
                />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3"
              >
                BikiniBottom
              </motion.h1>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-muted-foreground mb-10"
              >
                Where your agents come together
              </motion.p>

              {/* Value props */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 mb-10"
              >
                {VALUE_PROPS.map((prop, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-muted/50 border border-border"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <prop.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">{prop.text}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-col items-center gap-3"
              >
                <Button
                  onClick={startOnboarding}
                  size="lg"
                  className="w-full max-w-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/25"
                >
                  Get Started
                </Button>
                <button
                  onClick={skipOnboarding}
                  className="text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                >
                  Skip tour
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
