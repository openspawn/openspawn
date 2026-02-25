/**
 * KelpSilhouette — SVG kelp at the bottom of hero / dashboard.
 * Animated with CSS sway for underwater depth cue.
 */

export function KelpSilhouette({ className = '' }: { className?: string }) {
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
        {/* Back kelp layer — darkest, slowest sway */}
        <g style={{ animation: 'bb-kelp-sway 5s ease-in-out infinite', transformOrigin: 'bottom center' }}>
          {[80, 180, 320, 480, 650, 820, 960, 1100, 1280, 1400].map((x, i) => (
            <path
              key={`back-${i}`}
              d={`M${x} 120 Q${x + 15 * (i % 2 === 0 ? 1 : -1)} 80 ${x + 5} 40 Q${x + 20 * (i % 2 === 0 ? -1 : 1)} 20 ${x + 8} 0`}
              stroke="#0D3B2E"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
          ))}
        </g>

        {/* Mid kelp layer */}
        <g style={{ animation: 'bb-kelp-sway 4s 1s ease-in-out infinite', transformOrigin: 'bottom center' }}>
          {[40, 140, 260, 400, 540, 700, 850, 1010, 1160, 1340].map((x, i) => (
            <path
              key={`mid-${i}`}
              d={`M${x} 120 Q${x + 12 * (i % 2 === 0 ? -1 : 1)} 75 ${x - 3} 35 Q${x + 18 * (i % 2 === 0 ? 1 : -1)} 15 ${x + 4} 0`}
              stroke="#0F4A39"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
          ))}
        </g>

        {/* Front kelp layer — lightest, fastest sway */}
        <g style={{ animation: 'bb-kelp-sway 3s 0.5s ease-in-out infinite', transformOrigin: 'bottom center' }}>
          {[10, 110, 230, 370, 510, 660, 790, 930, 1070, 1220, 1380].map((x, i) => (
            <path
              key={`front-${i}`}
              d={`M${x} 120 Q${x + 10 * (i % 2 === 0 ? 1 : -1)} 70 ${x + 2} 30 Q${x + 15 * (i % 2 === 0 ? -1 : 1)} 10 ${x + 5} 0`}
              stroke="#165C42"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
