/**
 * Zero-Config CLI illustration
 * Shows a terminal with the scaffold → start → deploy sequence.
 * ~100×100px feel · dark backgrounds · minimal/iconic
 */
export function ZeroConfigCliIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Terminal window frame ─────────────────────────────────────────── */}
      <rect
        x="4"
        y="6"
        width="92"
        height="88"
        rx="7"
        fill="rgba(13,17,23,0.95)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* Title bar */}
      <rect x="4" y="6" width="92" height="16" rx="7" fill="rgba(22,27,34,0.95)" />
      <rect x="4" y="16" width="92" height="6" fill="rgba(22,27,34,0.95)" />

      {/* Traffic lights */}
      <circle cx="15" cy="14" r="3" fill="rgba(255,95,87,0.80)" />
      <circle cx="25" cy="14" r="3" fill="rgba(254,188,46,0.80)" />
      <circle cx="35" cy="14" r="3" fill="rgba(40,200,64,0.70)" />

      {/* Window title */}
      <text x="50" y="16" textAnchor="middle" fontSize="5" fill="#475569" fontFamily="monospace">
        openspawn — bash
      </text>

      {/* ── Terminal content ──────────────────────────────────────────────── */}
      <g fontFamily="monospace" fontSize="6.5">
        {/* Line 1: prompt + init */}
        <text x="10" y="34">
          <tspan fill="#64748b">$ </tspan>
          <tspan fill="#22d3ee">npx openspawn init my-org</tspan>
        </text>

        {/* Line 2: success messages */}
        <text x="10" y="43">
          <tspan fill="#34d399">✓ </tspan>
          <tspan fill="#94a3b8">Scaffolded ORG.md + config</tspan>
        </text>
        <text x="10" y="52">
          <tspan fill="#34d399">✓ </tspan>
          <tspan fill="#94a3b8">Ready in </tspan>
          <tspan fill="#fbbf24">0.4s</tspan>
        </text>

        {/* Blank line */}
        <text x="10" y="61">
          <tspan fill="#64748b">$ </tspan>
          <tspan fill="#22d3ee">npx openspawn start</tspan>
        </text>

        <text x="10" y="70">
          <tspan fill="#34d399">🚀 </tspan>
          <tspan fill="#94a3b8">5 agents online</tspan>
        </text>

        <text x="10" y="79">
          <tspan fill="#34d399">✓ </tspan>
          <tspan fill="#a78bfa">localhost:3333</tspan>
          <tspan fill="#64748b"> / </tspan>
          <tspan fill="#a78bfa">app/</tspan>
        </text>

        {/* Current line: blinking cursor */}
        <text x="10" y="88">
          <tspan fill="#64748b">$ </tspan>
          <tspan fill="#e2e8f0">_</tspan>
        </text>
      </g>

      {/* Blinking cursor */}
      <rect x="17" y="82" width="4" height="7" rx="0.5" fill="#22d3ee">
        <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
      </rect>

      {/* ── Bottom badge: 30 seconds ──────────────────────────────────────── */}
      <rect
        x="54"
        y="82"
        width="38"
        height="10"
        rx="3"
        fill="rgba(34,211,238,0.08)"
        stroke="rgba(34,211,238,0.20)"
        strokeWidth="0.8"
      />
      <text
        x="73"
        y="89"
        textAnchor="middle"
        fontSize="5"
        fill="#22d3ee"
        fontFamily="monospace"
        fontWeight="700"
      >
        ⚡ 30s to running
      </text>
    </svg>
  );
}
