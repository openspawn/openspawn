import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Sparkles, Network, LayoutDashboard, Coins, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useDemo } from './DemoProvider';

const STORAGE_KEY = 'openspawn-demo-welcomed';

export function DemoWelcome() {
  const [isVisible, setIsVisible] = useState(false);
  const { play, isPlaying } = useDemo();

  useEffect(() => {
    // Show welcome if user hasn't seen it
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  const handleStart = () => {
    if (!isPlaying) {
      play();
    }
    handleDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative mx-4 max-w-lg rounded-xl border border-border bg-card p-8 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold">Welcome to OpenSpawn</h2>
              <p className="mt-2 text-muted-foreground">
                The operating system for AI agent teams
              </p>
            </div>

            {/* Features */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <FeatureCard
                icon={Network}
                title="Agent Network"
                description="Visualize your AI hierarchy"
                delay={0.15}
              />
              <FeatureCard
                icon={CheckSquare}
                title="Task Management"
                description="Kanban workflow for agents"
                delay={0.2}
              />
              <FeatureCard
                icon={Coins}
                title="Credit Economy"
                description="Track agent spending"
                delay={0.25}
              />
              <FeatureCard
                icon={LayoutDashboard}
                title="Real-time Dashboard"
                description="Live metrics & events"
                delay={0.3}
              />
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleStart}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Exploring
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                This is a live simulation — watch agents work in real-time
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-lg border border-border bg-accent/30 p-3"
    >
      <Icon className="mb-1 h-5 w-5 text-primary" />
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </motion.div>
  );
}
