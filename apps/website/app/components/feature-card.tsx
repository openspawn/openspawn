import { Badge } from "./badge";

type BadgeColor = "cyan" | "violet" | "amber" | "emerald" | "red" | "slate";

interface FeatureCardProps {
  emoji: string;
  title: string;
  description: string;
  color: string;
  href?: string;
  category?: string;
  /** Badge color for the category pill. Replaces the old `categoryColor` class string. */
  badgeColor?: BadgeColor;
  /** @deprecated Use `badgeColor` instead */
  categoryColor?: string;
  /**
   * Optional SVG illustration component rendered above the title.
   * When provided, replaces the emoji as the visual focal point.
   * Should accept a `className` prop for sizing.
   */
  illustration?: React.ComponentType<{ className?: string }>;
}

export function FeatureCard({
  emoji,
  title,
  description,
  color,
  href,
  category,
  badgeColor = "slate",
  illustration: Illustration,
}: FeatureCardProps) {
  const inner = (
    <>
      {category && (
        <div className="mb-3">
          <Badge color={badgeColor} size="sm" uppercase>
            {category}
          </Badge>
        </div>
      )}

      {/* Visual: SVG illustration (preferred) or emoji fallback */}
      <div className="mb-4">
        {Illustration ? (
          <Illustration className="w-16 h-16 transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <span className="text-3xl">{emoji}</span>
        )}
      </div>

      <h3 className={`mb-2 text-lg font-semibold ${color}`}>{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      {href && (
        <span className="mt-3 inline-block text-xs font-medium text-slate-500 transition group-hover:text-cyan-400">
          Learn more →
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="group block rounded-xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-cyan-500/20 hover:bg-cyan-500/[0.04] no-underline"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-white/10 hover:bg-white/[0.04]">
      {inner}
    </div>
  );
}
