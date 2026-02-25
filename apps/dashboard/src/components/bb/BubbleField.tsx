/**
 * BubbleField — floating bubble particles for underwater atmosphere.
 * Render as an absolute-positioned layer behind main content.
 */

interface BubbleFieldProps {
  count?: number;
  className?: string;
}

export function BubbleField({ count = 18, className = '' }: BubbleFieldProps) {
  // Deterministic-ish bubbles (stable across renders, no Math.random in render)
  const bubbles = Array.from({ length: count }, (_, i) => {
    const seed = i * 7919; // prime-based seed for variety
    return {
      id: i,
      size:     (((seed * 13) % 12) + 4),            // 4–16px
      left:     ((seed * 17) % 100),                  // 0–100%
      bottom:   ((seed * 23) % 30),                   // 0–30%
      delay:    ((seed * 11) % 12),                   // 0–12s
      duration: (((seed * 7) % 8) + 8),               // 8–16s
      opacity:  (((seed * 31) % 30) / 100) + 0.15,   // 0.15–0.45
    };
  });

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {bubbles.map(b => (
        <div
          key={b.id}
          className="absolute rounded-full border border-[#B8E4F7]/30"
          style={{
            width:    b.size,
            height:   b.size,
            left:     `${b.left}%`,
            bottom:   `${b.bottom}%`,
            opacity:  b.opacity,
            background: 'radial-gradient(circle at 30% 30%, rgba(184,228,247,0.5), rgba(74,174,217,0.1))',
            animation: `bb-bubble-float ${b.duration}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
