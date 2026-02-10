import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, LayoutDashboard, Users, CheckSquare, Network, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { useOnboarding } from './onboarding-provider';

interface TourStep {
  selector: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="dashboard"]',
    title: 'Your Command Center',
    description: 'Get a bird\'s-eye view of your entire agent ecosystem — active agents, tasks, credits, and live activity all in one place.',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    selector: '[data-tour="agents"]',
    title: 'Your Agents Live Here',
    description: 'Browse, monitor, and manage all your AI agents. See their status, capabilities, and performance at a glance.',
    icon: <Users className="w-5 h-5" />,
  },
  {
    selector: '[data-tour="tasks"]',
    title: 'Create & Track Tasks',
    description: 'Your task board shows everything in flight — from backlog to done. Agents pick up work and report progress in real-time.',
    icon: <CheckSquare className="w-5 h-5" />,
  },
  {
    selector: '[data-tour="network"]',
    title: 'Visualize Agent Connections',
    description: 'The network graph reveals how agents interact, delegate, and collaborate. Watch relationships form in real-time.',
    icon: <Network className="w-5 h-5" />,
  },
  {
    selector: '[data-tour="cmdk"]',
    title: 'Search Anything',
    description: 'Press ⌘K (or Ctrl+K) to instantly search agents, tasks, pages, and actions. The fastest way to navigate.',
    icon: <Search className="w-5 h-5" />,
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function FeatureTour() {
  const { isOnboarding, currentStep, totalSteps, nextStep, prevStep, skipOnboarding } = useOnboarding();
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const rafRef = useRef<number>(0);

  const step = TOUR_STEPS[currentStep - 1];

  const updateSpotlight = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      const padding = 8;
      setSpotlight({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Determine tooltip position
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const centerY = rect.top + rect.height / 2;
      const centerX = rect.left + rect.width / 2;

      if (centerY < viewportHeight * 0.4) {
        setTooltipPos('bottom');
      } else if (centerY > viewportHeight * 0.6) {
        setTooltipPos('top');
      } else if (centerX < viewportWidth * 0.5) {
        setTooltipPos('right');
      } else {
        setTooltipPos('left');
      }
    } else {
      // Element not visible — show tooltip in center
      setSpotlight(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOnboarding) return;

    updateSpotlight();

    const handleResizeOrScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateSpotlight);
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isOnboarding, currentStep, updateSpotlight]);

  // Click outside to dismiss
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    // If clicking inside the spotlight area, let it through
    if (spotlight) {
      const { clientX: x, clientY: y } = e;
      if (
        x >= spotlight.left &&
        x <= spotlight.left + spotlight.width &&
        y >= spotlight.top &&
        y <= spotlight.top + spotlight.height
      ) {
        return;
      }
    }
    skipOnboarding();
  }, [spotlight, skipOnboarding]);

  if (!isOnboarding || !step) return null;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlight) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const gap = 16;
    switch (tooltipPos) {
      case 'bottom':
        return {
          top: spotlight.top + spotlight.height + gap,
          left: Math.max(16, Math.min(spotlight.left, window.innerWidth - 360)),
        };
      case 'top':
        return {
          bottom: window.innerHeight - spotlight.top + gap,
          left: Math.max(16, Math.min(spotlight.left, window.innerWidth - 360)),
        };
      case 'right':
        return {
          top: Math.max(16, spotlight.top),
          left: spotlight.left + spotlight.width + gap,
        };
      case 'left':
        return {
          top: Math.max(16, spotlight.top),
          right: window.innerWidth - spotlight.left + gap,
        };
    }
  };

  return (
    <AnimatePresence>
      {isOnboarding && (
        <div className="fixed inset-0 z-[100]" onClick={handleOverlayClick}>
          {/* SVG overlay with cutout */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <mask id="tour-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {spotlight && (
                  <motion.rect
                    initial={false}
                    animate={{
                      x: spotlight.left,
                      y: spotlight.top,
                      width: spotlight.width,
                      height: spotlight.height,
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    rx="12"
                    ry="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(2, 6, 23, 0.75)"
              mask="url(#tour-spotlight-mask)"
              style={{ pointerEvents: 'auto' }}
            />
          </svg>

          {/* Spotlight border glow */}
          {spotlight && (
            <motion.div
              initial={false}
              animate={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute rounded-xl border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] pointer-events-none"
            />
          )}

          {/* Tooltip */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={getTooltipStyle()}
            className="absolute w-[340px] max-w-[calc(100vw-32px)] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step counter pill */}
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-400">
                {currentStep} of {totalSteps}
              </span>
              <button
                onClick={skipOnboarding}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                  {step.icon}
                </div>
                <h3 className="text-base font-semibold text-white">{step.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-4 pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep <= 1}
                className="text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={nextStep}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {currentStep === totalSteps ? 'Finish' : 'Next'}
                {currentStep < totalSteps && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 pb-3">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i + 1 === currentStep
                      ? 'bg-cyan-400 w-4'
                      : i + 1 < currentStep
                        ? 'bg-cyan-600'
                        : 'bg-slate-600'
                  }`}
                  style={{ borderRadius: '9999px', transition: 'all 0.2s' }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
