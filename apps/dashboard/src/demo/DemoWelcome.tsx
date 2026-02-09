import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Users, Zap, Building2, Rocket, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useDemo, type ScenarioName } from './DemoProvider';

const SCENARIOS: { id: ScenarioName; name: string; icon: React.ReactNode; description: string; stats: string; color: string }[] = [
  {
    id: 'acmetech',
    name: 'AcmeTech Product Launch',
    icon: <Building2 className="w-6 h-6" />,
    description: 'Watch 22 agents build a SaaS dashboard from discovery to launch',
    stats: '22 agents • 24 tasks • 6 phases',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'startup',
    name: 'Startup Team',
    icon: <Rocket className="w-6 h-6" />,
    description: 'Small agile team tackling their first sprint',
    stats: '5 agents • 10 tasks • Active',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'growth',
    name: 'Growth Stage',
    icon: <TrendingUp className="w-6 h-6" />,
    description: 'Scaling team with established workflows',
    stats: '12 agents • 18 tasks • Busy',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <Users className="w-6 h-6" />,
    description: 'Large organization with complex hierarchy',
    stats: '25+ agents • 30+ tasks • Complex',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'fresh',
    name: 'Fresh Start',
    icon: <Sparkles className="w-6 h-6" />,
    description: 'Empty slate - watch agents spawn from scratch',
    stats: '0 agents • 0 tasks • Clean',
    color: 'from-slate-500 to-slate-600',
  },
];

const STORAGE_KEY = 'openspawn-demo-welcomed';

export function DemoWelcome() {
  const { setScenario } = useDemo();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioName>('acmetech');

  useEffect(() => {
    // Check if user has seen the welcome before
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleStart = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setScenario(selectedScenario, true); // autoPlay = true
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={handleSkip}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-800">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Welcome to OpenSpawn</h2>
                  <p className="text-sm text-slate-400">Multi-agent coordination platform</p>
                </div>
              </div>
              
              <p className="text-slate-300 text-sm mt-3">
                Pick a scenario to explore. Watch AI agents collaborate, manage tasks, and spend credits in real-time.
              </p>
            </div>

            {/* Scenario Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-3">
                {SCENARIOS.map((scenario) => (
                  <motion.button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedScenario === scenario.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${scenario.color} flex items-center justify-center text-white shrink-0`}>
                        {scenario.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{scenario.name}</h3>
                          {scenario.id === 'acmetech' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-violet-500/20 text-violet-400 rounded">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mt-0.5">{scenario.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{scenario.stats}</p>
                      </div>
                      {selectedScenario === scenario.id && (
                        <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  💡 Use the bottom bar to switch scenarios anytime
                </p>
                <Button
                  onClick={handleStart}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Demo
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Reset the welcome modal (for testing)
 */
export function resetDemoWelcome() {
  localStorage.removeItem(STORAGE_KEY);
}
