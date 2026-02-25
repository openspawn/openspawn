/**
 * KelpSilhouette — SVG kelp at the bottom of hero / dashboard.
 * POLISH PASS: Per-strand animation-delay variation, 3 sway amplitude variants,
 * 4 depth layers for natural parallax feel.
 * CSS animations only. prefers-reduced-motion: respected via global bb-tokens.css rule.
 */

// Per-strand config: x position, color, strokeWidth, sway variant, delay
interface Strand {
  x: number;
  color: string;
  sw: number;
  anim: string; // animation name
  delay: number; // seconds
  dur: number;   // seconds
  opacity: number;
  ctrl1offset: number; // Q control point x offset
  ctrl2offset: number;
}

// Generate deterministic per-strand variation
function makeStrand(x: number, i: number, layer: 0|1|2|3): Strand {
  const seed = x * 17 + i * 31;
  const layers = [
    { color: '#062A1A', sw: 12, opBase: 0.5  },  // back — darkest, thickest
    { color: '#0A3826', sw: 9,  opBase: 0.65 },  // mid-back
    { color: '#0F4A39', sw: 7,  opBase: 0.78 },  // mid-front
    { color: '#165C42', sw: 5,  opBase: 0.92 },  // front — lightest, finest
  ] as const;
  const l = layers[layer];

  const animNames = ['bb-kelp-sway-gentle', 'bb-kelp-sway-medium', 'bb-kelp-sway-strong'];
  const anim = animNames[seed % animNames.length];

  // Duration varies 3-6s per layer range
  const durBase = [5, 4.5, 4, 3.2] as const;
  const dur = durBase[layer] + (seed % 20) / 10; // +0-2s variation

  // Delay 0-2.5s per strand
  const delay = (seed % 25) / 10;

  // Control point offsets for S-curve shape variation
  const ctrl1offset = 10 + (seed % 12) * (i % 2 === 0 ? 1 : -1);
  const ctrl2offset = 18 + (seed % 8) * (i % 2 === 0 ? -1 : 1);

  return {
    x,
    color: l.color,
    sw: l.sw,
    anim,
    delay,
    dur,
    opacity: l.opBase - (seed % 12) / 100, // subtle variation
    ctrl1offset,
    ctrl2offset,
  };
}

export function KelpSilhouette({ className = '' }: { className?: string }) {
  // Layer x positions — offset per layer for depth feel
  const backXs   = [60, 170, 310, 470, 640, 810, 950, 1090, 1270, 1390];
  const midBackXs = [95, 190, 330, 490, 655, 820, 970, 1110, 1290, 1400];
  const midFrontXs= [30, 130, 250, 390, 530, 680, 810, 950,  1090, 1240, 1370];
  const frontXs  = [10, 110, 230, 370, 510, 660, 790, 930,  1070, 1220, 1380];

  const backStrands    = backXs.map((x, i) => makeStrand(x, i, 0));
  const midBackStrands = midBackXs.map((x, i) => makeStrand(x, i, 1));
  const midFrontStrands= midFrontXs.map((x, i) => makeStrand(x, i, 2));
  const frontStrands   = frontXs.map((x, i) => makeStrand(x, i, 3));

  const renderStrand = (s: Strand, key: string) => {
    const mid = `M${s.x} 120 Q${s.x + s.ctrl1offset} 75 ${s.x - 3} 35 Q${s.x + s.ctrl2offset} 10 ${s.x + 5} 0`;
    return (
      <path
        key={key}
        d={mid}
        stroke={s.color}
        strokeWidth={s.sw}
        fill="none"
        strokeLinecap="round"
        opacity={s.opacity}
        style={{
          animation: `${s.anim} ${s.dur}s ${s.delay}s ease-in-out infinite`,
          transformOrigin: 'bottom center',
        }}
      />
    );
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-24 md:h-32"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Layer 0 — back (darkest, slowest, gentle sway) */}
        {backStrands.map((s, i) => renderStrand(s, `back-${i}`))}

        {/* Layer 1 — mid-back */}
        {midBackStrands.map((s, i) => renderStrand(s, `midback-${i}`))}

        {/* Layer 2 — mid-front */}
        {midFrontStrands.map((s, i) => renderStrand(s, `midfront-${i}`))}

        {/* Layer 3 — front (lightest, fastest, strongest sway) */}
        {frontStrands.map((s, i) => renderStrand(s, `front-${i}`))}
      </svg>
    </div>
  );
}
