<<<<<<< HEAD
import { Network, LayoutDashboard, Users, Coins } from 'lucide-react';
import { Button } from './button';

const ICONS = {
  network: Network,
  dashboard: LayoutDashboard,
  agents: Users,
  credits: Coins,
} as const;

interface EmptyStateProps {
  variant?: keyof typeof ICONS;
=======
import { motion } from "framer-motion";
import { Button } from "./button";

type EmptyStateVariant = "agents" | "tasks" | "messages" | "events" | "credits" | "network" | "generic";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
>>>>>>> 63941bb (feat(dashboard): add EmptyState component with ocean-themed illustrations #174)
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
<<<<<<< HEAD
}

export function EmptyState({ variant = 'dashboard', title, description, ctaLabel, onCta }: EmptyStateProps) {
  const Icon = ICONS[variant] ?? LayoutDashboard;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-cyan-500/10 p-4 mb-4">
        <Icon className="h-8 w-8 text-cyan-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {ctaLabel && onCta && (
        <Button variant="outline" onClick={onCta} className="text-sm">
          {ctaLabel}
        </Button>
      )}
    </div>
=======
  compact?: boolean;
}

function Bubbles({ compact }: { compact?: boolean }) {
  const bubbles = compact
    ? [
        { cx: 20, cy: 40, r: 3, delay: 0 },
        { cx: 80, cy: 30, r: 2, delay: 0.5 },
        { cx: 60, cy: 50, r: 4, delay: 1 },
      ]
    : [
        { cx: 30, cy: 80, r: 4, delay: 0 },
        { cx: 70, cy: 60, r: 3, delay: 0.4 },
        { cx: 110, cy: 90, r: 5, delay: 0.8 },
        { cx: 50, cy: 40, r: 2.5, delay: 1.2 },
        { cx: 90, cy: 70, r: 3.5, delay: 0.6 },
      ];

  return (
    <>
      {bubbles.map((b, i) => (
        <motion.circle
          key={i}
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.8}
          opacity={0.4}
          animate={{ y: [0, -8, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

const illustrations: Record<EmptyStateVariant, (compact?: boolean) => React.ReactNode> = {
  agents: (compact) => (
    <svg viewBox="0 0 120 100" className="w-full h-full text-cyan-500">
      <Bubbles compact={compact} />
      <motion.g animate={{ x: [0, 6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="60" cy="50" rx="14" ry="8" fill="currentColor" opacity={0.2} />
        <ellipse cx="60" cy="50" rx="14" ry="8" stroke="currentColor" strokeWidth={1} fill="none" />
        <circle cx="68" cy="48" r="1.5" fill="currentColor" opacity={0.6} />
        <path d="M44 50 L38 44 L38 56 Z" fill="currentColor" opacity={0.3} />
      </motion.g>
      <path d="M15 95 Q18 80 20 70 Q22 60 25 70 Q28 80 30 95" stroke="currentColor" strokeWidth={1.5} fill="none" opacity={0.25} />
      <path d="M90 95 Q93 82 96 75 Q99 82 102 95" stroke="currentColor" strokeWidth={1.5} fill="none" opacity={0.2} />
    </svg>
  ),
  tasks: (compact) => (
    <svg viewBox="0 0 120 100" className="w-full h-full text-cyan-500">
      <Bubbles compact={compact} />
      <motion.g animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "60px 55px" }}>
        <rect x="42" y="35" width="36" height="40" rx="4" stroke="currentColor" strokeWidth={1.2} fill="currentColor" fillOpacity={0.08} />
        <line x1="50" y1="48" x2="70" y2="48" stroke="currentColor" strokeWidth={1} opacity={0.4} />
        <line x1="50" y1="55" x2="65" y2="55" stroke="currentColor" strokeWidth={1} opacity={0.3} />
        <line x1="50" y1="62" x2="68" y2="62" stroke="currentColor" strokeWidth={1} opacity={0.2} />
      </motion.g>
    </svg>
  ),
  messages: (compact) => (
    <svg viewBox="0 0 120 100" className="w-full h-full text-cyan-500">
      <Bubbles compact={compact} />
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <rect x="30" y="35" width="35" height="22" rx="8" stroke="currentColor" strokeWidth={1} fill="currentColor" fillOpacity={0.1} />
        <path d="M40 57 L35 65 L45 57" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth={1} />
      </motion.g>
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "easeInOut" }}>
        <rect x="55" y="50" width="35" height="22" rx="8" stroke="currentColor" strokeWidth={1} fill="currentColor" fillOpacity={0.15} />
        <path d="M80 72 L85 80 L75 72" fill="currentColor" fillOpacity={0.15} stroke="currentColor" strokeWidth={1} />
      </motion.g>
    </svg>
  ),
  events: (compact) => (
    <svg viewBox="0 0 120 100" className="w-full h-full text-cyan-500">
      <Bubbles compact={compact} />
      <motion.path
        d="M20 55 L35 55 L40 40 L50 65 L60 45 L70 60 L75 55 L100 55"
        stroke="currentColor" strokeWidth={1.5} fill="none" opacity={0.5}
        animate={{ pathLength: [0, 1], opacity: [0.2, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  ),
  credits: (compact) => (
    <svg viewBox="0 0 120 100" className="w-full h-full text-cyan-500">
      <Bubbles compact={compact} />
      <motion.g animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "60px 50px" }}>
        <circle cx="60" cy="50" r="18" stroke="currentColor" strokeWidth={1.5} fill="currentColor" fillOpacity={0.1} />
        <text x="60" y="56" textAnchor="middle" fill="currentColor" fontSize="16" opacity={0.5}>¢</text>
      </motion.g>
    </svg>
  ),
  network: (compact) => (
    <svg viewBox="0 0 120 100" className="w-full h-full text-cyan-500">
      <Bubbles compact={compact} />
      <motion.g animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
        <line x1="40" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth={0.8} opacity={0.3} />
        <line x1="60" y1="40" x2="60" y2="70" stroke="currentColor" strokeWidth={0.8} opacity={0.3} />
        <line x1="40" y1="40" x2="60" y2="70" stroke="currentColor" strokeWidth={0.8} opacity={0.2} />
        <line x1="80" y1="40" x2="60" y2="70" stroke="currentColor" strokeWidth={0.8} opacity={0.2} />
        <circle cx="40" cy="40" r="5" fill="currentColor" opacity={0.3} />
        <circle cx="80" cy="40" r="5" fill="currentColor" opacity={0.3} />
        <circle cx="60" cy="70" r="5" fill="currentColor" opacity={0.3} />
      </motion.g>
    </svg>
  ),
  generic: (compact) => (
    <svg viewBox="0 0 120 100" className="w-full h-full text-cyan-500">
      <Bubbles compact={compact} />
      <motion.g animate={{ rotate: [0, 15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "60px 55px" }}>
        <circle cx="60" cy="55" r="12" stroke="currentColor" strokeWidth={1} fill="currentColor" fillOpacity={0.1} />
      </motion.g>
    </svg>
  ),
};

export function EmptyState({ variant = "generic", title, description, ctaLabel, onCta, compact = false }: EmptyStateProps) {
  const illustrationSize = compact ? "w-20 h-16" : "w-32 h-24";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-16"}`}
    >
      <div className={illustrationSize}>
        {illustrations[variant]?.(compact) ?? illustrations.generic(compact)}
      </div>
      <h3 className={`font-semibold mt-4 ${compact ? "text-base" : "text-lg"}`}>{title}</h3>
      <p className={`text-muted-foreground max-w-sm mt-1 ${compact ? "text-xs" : "text-sm"}`}>{description}</p>
      {ctaLabel && onCta && (
        <Button onClick={onCta} className="mt-4 bg-cyan-600 hover:bg-cyan-700" size={compact ? "sm" : "default"}>
          {ctaLabel}
        </Button>
      )}
    </motion.div>
>>>>>>> 63941bb (feat(dashboard): add EmptyState component with ocean-themed illustrations #174)
  );
}
