interface FeatureCardProps {
  emoji: string;
  title: string;
  description: string;
  color: string;
}

export function FeatureCard({ emoji, title, description, color }: FeatureCardProps) {
  return (
    <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-white/10 hover:bg-white/[0.04]">
      <div className="mb-3 text-3xl">{emoji}</div>
      <h3 className={`mb-2 text-lg font-semibold ${color}`}>{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}
