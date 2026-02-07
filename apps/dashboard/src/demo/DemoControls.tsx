import { Play, Pause, RotateCcw, Zap, Users, Building2, Rocket } from 'lucide-react';
import { useDemo } from './DemoProvider';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const SPEED_OPTIONS = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 5, label: '5×' },
  { value: 10, label: '10×' },
  { value: 50, label: '50×' },
];

const SCENARIO_OPTIONS = [
  { value: 'startup' as const, label: 'Startup', icon: Rocket, agents: 5 },
  { value: 'growth' as const, label: 'Growth', icon: Users, agents: 14 },
  { value: 'enterprise' as const, label: 'Enterprise', icon: Building2, agents: 50 },
];

export function DemoControls() {
  const {
    isDemo,
    isPlaying,
    speed,
    currentTick,
    scenario,
    recentEvents,
    play,
    pause,
    setSpeed,
    setScenario,
    reset,
  } = useDemo();

  if (!isDemo) return null;

  const lastEvent = recentEvents[0];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card border rounded-2xl shadow-xl p-2 flex items-center gap-2">
        {/* Play/Pause */}
        <Button
          variant="ghost"
          size="icon"
          onClick={isPlaying ? pause : play}
          className="h-10 w-10"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        {/* Speed selector */}
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSpeed(opt.value)}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                speed === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Scenario selector */}
        <div className="flex items-center gap-1">
          {SCENARIO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setScenario(opt.value)}
              title={`${opt.label} (${opt.agents} agents)`}
              className={cn(
                'p-2 rounded-lg transition-colors flex items-center gap-1.5',
                scenario === opt.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <opt.icon className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Tick counter */}
        <div className="flex items-center gap-1.5 px-2">
          <Zap className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-sm font-mono tabular-nums min-w-[3ch]">
            {currentTick}
          </span>
        </div>

        {/* Reset */}
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          className="h-8 w-8"
          title="Reset simulation"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Event toast */}
      {lastEvent && isPlaying && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-card/95 backdrop-blur border rounded-lg px-3 py-1.5 text-sm shadow-lg">
            <EventLabel event={lastEvent} />
          </div>
        </div>
      )}
    </div>
  );
}

function EventLabel({ event }: { event: { type: string; payload: any } }) {
  switch (event.type) {
    case 'agent_created':
      return (
        <span className="text-green-500">
          🤖 <strong>{event.payload.name}</strong> spawned
        </span>
      );
    case 'agent_promoted':
      return (
        <span className="text-blue-500">
          ⬆️ <strong>{event.payload.agent.name}</strong> promoted to L{event.payload.newLevel}
        </span>
      );
    case 'agent_terminated':
      return (
        <span className="text-orange-500">
          ⏸️ <strong>{event.payload.agent.name}</strong> → {event.payload.newStatus}
        </span>
      );
    case 'task_created':
      return (
        <span className="text-purple-500">
          📋 Task created: <strong>{event.payload.title}</strong>
        </span>
      );
    case 'task_completed':
      return (
        <span className="text-emerald-500">
          ✅ Task done: <strong>{event.payload.task.title}</strong>
        </span>
      );
    case 'credit_earned':
      return (
        <span className="text-yellow-500">
          💰 <strong>{event.payload.agent.name}</strong> earned {event.payload.amount} credits
        </span>
      );
    case 'credit_spent':
      return (
        <span className="text-red-400">
          💸 <strong>{event.payload.agent.name}</strong> spent {event.payload.amount} credits
        </span>
      );
    default:
      return <span>📡 {event.type}</span>;
  }
}
