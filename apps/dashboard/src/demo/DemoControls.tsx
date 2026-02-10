import { Play, Pause, RotateCcw, Zap, Users, Building2, Rocket, Factory } from 'lucide-react';
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
  { value: 'acmetech' as const, label: 'AcmeTech', icon: Factory, agents: 22, description: 'Product launch lifecycle' },
  { value: 'startup' as const, label: 'Startup', icon: Rocket, agents: 5, description: 'Small team' },
  { value: 'growth' as const, label: 'Growth', icon: Users, agents: 14, description: 'Scaling up' },
  { value: 'enterprise' as const, label: 'Enterprise', icon: Building2, agents: 50, description: 'Full org' },
  { value: 'fresh' as const, label: 'Fresh', icon: Zap, agents: 1, description: 'Start from scratch' },
];

interface DemoControlsProps {
  compact?: boolean;
  /** Render as an inline strip for the desktop header bar */
  header?: boolean;
}

export function DemoControls({ compact = false, header = false }: DemoControlsProps) {
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

  // Header mode: inline strip for desktop top bar
  if (header) {
    return (
      <div className="flex items-center gap-1.5">
        {/* Scenario selector */}
        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
          {SCENARIO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setScenario(opt.value)}
              title={`${opt.label} (${opt.agents} agents)`}
              className={cn(
                'px-1.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1',
                scenario === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <opt.icon className="h-3 w-3" />
              <span className="hidden xl:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Play/Pause */}
        <Button
          variant="ghost"
          size="icon"
          onClick={isPlaying ? pause : play}
          className="h-7 w-7"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>

        {/* Speed */}
        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
          {SPEED_OPTIONS.slice(0, 4).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSpeed(opt.value)}
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors',
                speed === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Tick */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-yellow-500" />
          <span className="font-mono tabular-nums">{currentTick}</span>
        </div>

        {/* Reset */}
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          className="h-7 w-7"
          title="Reset simulation"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        {/* Demo indicator */}
        {isPlaying && (
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </div>
    );
  }

  // Compact mode for sidebar
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Play/Pause + Speed */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={isPlaying ? pause : play}
            className="h-7 w-7"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <div className="flex items-center gap-0.5 bg-muted rounded p-0.5 flex-1">
            {SPEED_OPTIONS.slice(0, 4).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSpeed(opt.value)}
                className={cn(
                  'flex-1 px-1 py-0.5 text-[10px] font-medium rounded transition-colors',
                  speed === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            className="h-7 w-7"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
        {/* Tick counter */}
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-yellow-500" />
          <span className="font-mono">{currentTick}</span>
          <span>ticks</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50">
      {/* Mobile: stacked layout, Desktop: horizontal */}
      <div className="bg-card border rounded-xl sm:rounded-2xl shadow-xl p-1.5 sm:p-2">
        {/* Mobile layout: two rows */}
        <div className="flex sm:hidden flex-col gap-1.5">
          {/* Row 1: Play, Speed, Tick */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={isPlaying ? pause : play}
              className="h-9 w-9"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 flex-1 justify-center">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSpeed(opt.value)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                    speed === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 px-2">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-mono tabular-nums">{currentTick}</span>
            </div>
          </div>
          
          {/* Row 2: Scenarios + Reset */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-1">
              {SCENARIO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setScenario(opt.value)}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1',
                    scenario === opt.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground bg-muted/50'
                  )}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              className="h-8 w-8"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Desktop layout: single row */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={isPlaying ? pause : play}
            className="h-10 w-10"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

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
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          <div className="flex items-center gap-1.5 px-2">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-sm font-mono tabular-nums min-w-[3ch]">{currentTick}</span>
          </div>

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
      </div>

      {/* Event toast - positioned above on mobile, hidden on very small screens */}
      {lastEvent && isPlaying && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-card/95 backdrop-blur border rounded-lg px-2 py-1 text-xs sm:text-sm shadow-lg truncate">
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
    case 'prehook_blocked':
      return (
        <span className="text-amber-500">
          🛡️ <strong>{event.payload.webhookName}</strong> blocked: {event.payload.reason || event.payload.eventType}
        </span>
      );
    case 'prehook_allowed':
      return (
        <span className="text-green-400">
          ✓ <strong>{event.payload.webhookName}</strong> approved {event.payload.eventType}
        </span>
      );
    default:
      return <span>📡 {event.type}</span>;
  }
}
