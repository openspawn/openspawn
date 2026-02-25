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
          {/* badge-pop enables the CSS hover-scale in .feature-card-enhanced */}
          <span className="badge-pop inline-block">
            <Badge color={badgeColor} size="sm" uppercase>
              {category}
            </Badge>
          </span>
        </div>
      )}

      {/* Visual: SVG illustration (preferred) or emoji fallback */}
      <div className="mb-4">
        {Illustration ? (
          /* illus-hover: CSS scale+drop-shadow on parent hover */
          <Illustration className="illus-hover w-16 h-16" />
        ) : (
          <span className="text-3xl">{emoji}</span>
        )}
      </div>

      <h3 className={`mb-2 text-lg font-semibold ${color}`}>{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      {href && (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-all duration-200 group-hover:text-cyan-400 group-hover:gap-2">
          Learn more
          <svg className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      )}
    </>
  );

  const sharedClasses =
    "group block rounded-xl border border-white/5 bg-white/[0.02] p-6 feature-card-enhanced no-underline";

  if (href) {
    return (
      <a
        href={href}
        className={`${sharedClasses} hover:border-cyan-500/20 hover:bg-cyan-500/[0.04]`}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={`${sharedClasses} hover:border-white/10 hover:bg-white/[0.04]`}>
      {inner}
    </div>
  );
}
