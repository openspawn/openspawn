import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Users, Building2, Rocket, TrendingUp, Sparkles, Layers, Wallet, Eye, Compass } from 'lucide-react';
import { Logo } from '../components/ui/logo';
import { Button } from '../components/ui/button';
import { useDemo, type ScenarioName } from './DemoProvider';
import { useOnboarding } from '../components/onboarding/onboarding-provider';

const SCENARIOS: { id: ScenarioName; name: string; icon: React.ReactNode; description: string; stats: string; color: string }[] = [
  {
    id: 'acmetech',
    name: 'AcmeTech Product Launch',
    icon: <Building2 className="w-6 h-6" />,
    description: 'Deep dive into a full product launch — 22 agents navigating the depths from discovery to deployment',
    stats: '22 agents • 24 tasks • 6 phases',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'startup',
    name: 'Startup Team',
    icon: <Rocket className="w-6 h-6" />,
    description: 'A nimble school of agents exploring shallow waters in their first sprint',
    stats: '5 agents • 10 tasks • Active',
    color: 'from-orange-400 to-coral-500',
  },
  {
    id: 'growth',
    name: 'Growth Stage',
    icon: <TrendingUp className="w-6 h-6" />,
    description: 'Mid-depth operations — established currents and coordinated workflows',
    stats: '12 agents • 18 tasks • Busy',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <Users className="w-6 h-6" />,
    description: 'Deep ocean trenches — complex hierarchies and vast coordination networks',
    stats: '25+ agents • 30+ tasks • Complex',
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'fresh',
    name: 'Fresh Start',
    icon: <Sparkles className="w-6 h-6" />,
    description: 'Pristine waters — witness the birth of your agent ecosystem from nothing',
    stats: '0 agents • 0 tasks • Clean',
    color: 'from-muted-foreground/60 to-cyan-700',
  },
];

const STORAGE_KEY = 'openspawn-demo-welcomed';

const VALUE_PROPS = [
  { icon: Layers, text: 'Orchestrate agents across tasks and teams' },
  { icon: Wallet, text: 'Set budgets and track credit flow in real-time' },
  { icon: Eye, text: 'Full visibility into every decision and action' },
];

export function DemoWelcome() {
  const { setScenario } = useDemo();
  const { skipOnboarding, startOnboarding } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'welcome' | 'scenarios'>('welcome');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioName>('acmetech');

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleStart = (withTour: boolean) => {
    const validScenarios: ScenarioName[] = ['acmetech', 'startup', 'growth', 'enterprise', 'fresh'];
    const scenarioToStart = selectedScenario && validScenarios.includes(selectedScenario) 
      ? selectedScenario 
      : 'acmetech';
    
    localStorage.setItem(STORAGE_KEY, 'true');
    setScenario(scenarioToStart, true);
    setIsOpen(false);

    if (withTour) {
      startOnboarding();
    } else {
      skipOnboarding();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    skipOnboarding();
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
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:h-[85vh] md:max-h-[700px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {step === 'welcome' ? (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center p-8 pt-10"
                >
                  {/* Animated icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
                    className="relative mb-6"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-500/20">
                      <Logo size="xl" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-2xl border-2 border-cyan-400"
                    />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-1"
                  >
                    Welcome to BikiniBottom
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-muted-foreground text-sm mb-8"
                  >
                    Multi-agent coordination from the deep
                  </motion.p>

                  {/* Value props */}
                  <div className="w-full space-y-3 mb-8">
                    {VALUE_PROPS.map((prop, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <prop.icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">{prop.text}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="w-full"
                  >
                    <Button
                      onClick={() => setStep('scenarios')}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/25"
                      size="lg"
                    >
                      Choose a Scenario →
                    </Button>
                    <button
                      onClick={handleSkip}
                      className="w-full mt-3 text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                    >
                      Skip, just dive in
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="scenarios"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="p-6 pb-4 border-b border-border">
                    <button
                      onClick={() => setStep('welcome')}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 flex items-center gap-1"
                    >
                      ← Back
                    </button>
                    <h2 className="text-xl font-bold text-foreground">Pick a Scenario</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Each scenario simulates a different sized organization with live agent activity.
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
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-border bg-muted/50 hover:border-border'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${scenario.color} flex items-center justify-center text-white shrink-0`}>
                              {scenario.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{scenario.name}</h3>
                                {scenario.id === 'acmetech' && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-cyan-500/20 text-cyan-400 rounded">
                                    RECOMMENDED
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">{scenario.description}</p>
                              <p className="text-xs text-muted-foreground/70 mt-1">{scenario.stats}</p>
                            </div>
                            {selectedScenario === scenario.id && (
                              <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
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
                  <div className="p-4 border-t border-border bg-card/50">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => handleStart(true)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Compass className="w-4 h-4" />
                        Start with Tour
                      </Button>
                      <Button
                        onClick={() => handleStart(false)}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Demo
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
