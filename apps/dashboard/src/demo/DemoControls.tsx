import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown,
  Zap,
  Clock,
  Users,
  CheckSquare,
} from 'lucide-react';
import { useDemoContext } from './DemoProvider';

const SPEED_OPTIONS = [1, 2, 5, 10, 50];

const PRESETS = [
  { name: 'Hiring Spree', tick: 50, icon: Users, description: 'Watch agents get spawned' },
  { name: 'Task Flow', tick: 100, icon: CheckSquare, description: 'See tasks move through stages' },
  { name: 'Payday', tick: 150, icon: Zap, description: 'Credits flowing everywhere' },
];

export function DemoControls() {
  const demo = useDemoContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  
  if (!demo?.isDemo) return null;
  
  const { isPlaying, speed, tick, play, pause, setSpeed, reset, jumpToTick } = demo;
  
  // Calculate simulated time (1 tick = 1 hour)
  const hours = tick % 24;
  const days = Math.floor(tick / 24);
  const timeString = `Day ${days + 1}, ${hours.toString().padStart(2, '0')}:00`;
  
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="bg-zinc-900/95 backdrop-blur-lg border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-sm font-semibold text-white">DEMO MODE</span>
            <span className="text-xs text-zinc-400">{timeString}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          )}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Playback controls */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={reset}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="w-4 h-4 text-zinc-300" />
                  </button>
                  
                  <button
                    onClick={isPlaying ? pause : play}
                    className="p-3 rounded-xl bg-pink-600 hover:bg-pink-500 transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
                
                {/* Speed selector */}
                <div className="flex items-center justify-center gap-1">
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                        ${speed === s 
                          ? 'bg-pink-600 text-white' 
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }
                      `}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                
                {/* Timeline scrubber */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <input
                      type="range"
                      min={0}
                      max={720}
                      value={tick}
                      onChange={(e) => jumpToTick(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-3 
                        [&::-webkit-slider-thumb]:h-3 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-pink-500
                        [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Day 1</span>
                    <span>Day 30</span>
                  </div>
                </div>
                
                {/* Presets toggle */}
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="w-full text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  {showPresets ? 'Hide' : 'Show'} quick jumps
                </button>
                
                {/* Presets */}
                <AnimatePresence>
                  {showPresets && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => jumpToTick(preset.tick)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-left"
                        >
                          <preset.icon className="w-4 h-4 text-pink-400" />
                          <div>
                            <div className="text-xs font-medium text-white">{preset.name}</div>
                            <div className="text-[10px] text-zinc-500">{preset.description}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
