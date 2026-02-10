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
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
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
  );
}
