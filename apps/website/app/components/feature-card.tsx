interface FeatureCardProps {
  emoji: string;
  title: string;
  description: string;
  color: string;
  href?: string;
}

export function FeatureCard({ emoji, title, description, color, href }: FeatureCardProps) {
  const inner = (
    <>
      <div className="mb-3 text-3xl">{emoji}</div>
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
