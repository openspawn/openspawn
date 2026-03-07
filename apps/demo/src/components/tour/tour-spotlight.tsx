import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTourSafe, TOUR_STEPS } from "./tour-context";
import { useLocation } from "@tanstack/react-router";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourSpotlight() {
  const tour = useTourSafe();
  const location = useLocation();
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const rafRef = useRef<number>(0);

  const step = tour?.isActive ? TOUR_STEPS[tour.currentStep] : null;
  const isCurrentPage =
    step && location.pathname.replace(/\/$/, "") === `/app${step.path}`.replace(/\/$/, "");
  const selector = isCurrentPage ? step?.spotlightSelector : null;

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    // Wait a bit for page to render
    const timeout = setTimeout(() => {
      const update = () => {
        const el = document.querySelector(selector);
        if (el) {
          const r = el.getBoundingClientRect();
          const pad = 12;
          setRect({
            top: r.top - pad,
            left: r.left - pad,
            width: r.width + pad * 2,
            height: r.height + pad * 2,
          });
        } else {
          setRect(null);
        }
        rafRef.current = requestAnimationFrame(update);
      };
      update();
    }, 300);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [selector]);

  if (!tour?.isActive || !isCurrentPage) return null;

  return (
    <AnimatePresence>
      {rect && (
        <motion.div
          key="spotlight-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9998] pointer-events-none"
        >
          {/* SVG overlay with cutout */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <mask id="tour-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={rect.left}
                  y={rect.top}
                  width={rect.width}
                  height={rect.height}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(2, 8, 23, 0.6)"
              mask="url(#tour-spotlight-mask)"
            />
            {/* Glow border around cutout */}
            <rect
              x={rect.left}
              y={rect.top}
              width={rect.width}
              height={rect.height}
              rx="12"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeOpacity="0.4"
            />
          </svg>

          {/* Tooltip card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="absolute pointer-events-auto"
            style={{
              top: rect.top + rect.height + 16,
              left: Math.max(16, Math.min(rect.left, window.innerWidth - 320)),
            }}
          >
            <div className="bg-[#0a1628]/95 backdrop-blur-xl border border-cyan-500/20 rounded-xl px-4 py-3 max-w-[280px] shadow-xl shadow-cyan-500/5">
              <div className="flex items-center gap-2 mb-1">
                {/* Pulsing indicator */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                </span>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  {step?.title}
                </span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">{step?.description}</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Show tooltip without spotlight when no selector */}
      {!rect && step && !step.spotlightSelector && (
        <motion.div
          key="spotlight-tooltip-only"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[9998] pointer-events-none"
        >
          <div className="bg-[#0a1628]/95 backdrop-blur-xl border border-cyan-500/20 rounded-xl px-5 py-3 shadow-xl shadow-cyan-500/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                {step.title}
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">{step.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
