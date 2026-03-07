import { motion, AnimatePresence } from "motion/react";
import { useTourSafe } from "./tour-context";
import { ChevronLeft, ChevronRight, X, Timer, TimerOff } from "lucide-react";

export function TourBar() {
  const tour = useTourSafe();
  if (!tour || !tour.isActive) return null;

  const { currentStep, steps, autoAdvance, setAutoAdvance, next, prev, exit } = tour;
  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none"
      >
        <div className="pointer-events-auto mx-auto max-w-3xl mb-4 px-4">
          <div className="relative bg-[#0a1628]/95 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-500/10 px-5 py-3.5">
            {/* Progress bar at top */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl overflow-hidden bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    {currentStep + 1} of {steps.length}
                  </span>
                  <span className="text-white/20">·</span>
                  <span className="text-xs font-semibold text-white/90 truncate">{step.title}</span>
                </div>
                <p className="text-[11px] text-white/40 truncate">{step.description}</p>
              </div>

              {/* Progress dots */}
              <div className="hidden sm:flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "bg-cyan-400 scale-125"
                        : i < currentStep
                          ? "bg-cyan-400/40"
                          : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAutoAdvance(!autoAdvance)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    autoAdvance
                      ? "text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20"
                      : "text-white/30 hover:text-white/50 hover:bg-white/5"
                  }`}
                  title={autoAdvance ? "Auto-advance ON" : "Auto-advance OFF"}
                >
                  {autoAdvance ? (
                    <Timer className="w-3.5 h-3.5" />
                  ) : (
                    <TimerOff className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={prev}
                  disabled={currentStep === 0}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={next}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/30 transition-all cursor-pointer"
                >
                  {currentStep === steps.length - 1 ? "Finish" : "Next"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={exit}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Exit Tour"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
