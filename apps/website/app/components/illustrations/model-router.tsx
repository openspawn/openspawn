/**
 * Model Router illustration
 * Shows a central router dispatching to multiple LLM providers.
 * Local-first: Ollama, Groq, OpenRouter, Claude, GPT-4
 * ~100×100px feel · dark backgrounds · minimal/iconic
 */
export function ModelRouterIllustration({ className = "" }: { className?: string }) {
  const providers = [
    { label: "Ollama", color: "#34d399", y: 12, tier: "local" },
    { label: "Groq", color: "#fbbf24", y: 34, tier: "fast" },
    { label: "Claude", color: "#a78bfa", y: 56, tier: "smart" },
    { label: "GPT-4o", color: "#22d3ee", y: 78, tier: "top" },
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Left: Task input ─────────────────────────────────────────────── */}
      <rect
        x="2"
        y="41"
        width="22"
        height="18"
        rx="3"
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="1"
      />
      <text x="13" y="48" textAnchor="middle" fontSize="5" fill="#94a3b8" fontFamily="monospace">
        TASK
      </text>
      {/* Task level indicator */}
      <rect x="5" y="52" width="14" height="4" rx="1" fill="rgba(34,211,238,0.12)" />
      <rect x="5" y="52" width="9" height="4" rx="1" fill="rgba(34,211,238,0.35)" />
      <text
        x="12"
        y="55.5"
        textAnchor="middle"
        fontSize="3.5"
        fill="#22d3ee"
        fontFamily="monospace"
      >
        L7
      </text>

      {/* ── Center: Router box ───────────────────────────────────────────── */}
      {/* Glow */}
      <circle cx="46" cy="50" r="16" fill="rgba(34,211,238,0.06)" />
      {/* Router card */}
      <rect
        x="33"
        y="36"
        width="26"
        height="28"
        rx="5"
        fill="rgba(18,45,77,0.90)"
        stroke="#22d3ee"
        strokeWidth="1.5"
      />
      {/* Router icon: branching lines inside */}
      <line x1="39" y1="50" x2="53" y2="50" stroke="rgba(34,211,238,0.30)" strokeWidth="0.8" />
      <line x1="46" y1="42" x2="46" y2="58" stroke="rgba(34,211,238,0.30)" strokeWidth="0.8" />
      {/* Router label */}
      <text
        x="46"
        y="48"
        textAnchor="middle"
        fontSize="5.5"
        fill="#22d3ee"
        fontFamily="monospace"
        fontWeight="800"
      >
        ROUTE
      </text>
      <text x="46" y="57" textAnchor="middle" fontSize="4.5" fill="#64748b" fontFamily="monospace">
        router
      </text>

      {/* Input arrow: task → router */}
      <line
        x1="24"
        y1="50"
        x2="32"
        y2="50"
        stroke="#22d3ee"
        strokeWidth="1"
        strokeDasharray="1.5,1.5"
      />
      <path
        d="M30,47 L33,50 L30,53"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* ── Right: Provider nodes ────────────────────────────────────────── */}
      {providers.map((p) => {
        const lineY = p.y + 7;
        return (
          <g key={p.label}>
            {/* Connection line: router → provider */}
            <line
              x1="59"
              y1="50"
              x2="70"
              y2={lineY}
              stroke={p.color}
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.45"
            />
            {/* Arrowhead */}
            <path
              d={`M68,${lineY - 3} L71,${lineY} L68,${lineY + 3}`}
              fill="none"
              stroke={p.color}
              strokeWidth="0.8"
              strokeLinejoin="round"
              opacity="0.6"
            />
            {/* Provider pill */}
            <rect
              x="71"
              y={p.y}
              width="26"
              height="14"
              rx="3"
              fill={`${p.color}18`}
              stroke={p.color}
              strokeWidth="1"
            />
            <text
              x="84"
              y={p.y + 6.5}
              textAnchor="middle"
              fontSize="5.5"
              fill={p.color}
              fontFamily="monospace"
              fontWeight="700"
            >
              {p.label}
            </text>
            <text
              x="84"
              y={p.y + 11.5}
              textAnchor="middle"
              fontSize="3.8"
              fill={p.color}
              fontFamily="monospace"
              opacity="0.6"
            >
              {p.tier}
            </text>
          </g>
        );
      })}

      {/* Router output arrow */}
      <path
        d="M57,47 L60,50 L57,53"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* ── Cost savings badge ────────────────────────────────────────────── */}
      <rect
        x="2"
        y="78"
        width="30"
        height="14"
        rx="3"
        fill="rgba(52,211,153,0.08)"
        stroke="rgba(52,211,153,0.20)"
        strokeWidth="0.8"
      />
      <text
        x="17"
        y="84.5"
        textAnchor="middle"
        fontSize="5"
        fill="#34d399"
        fontFamily="monospace"
        fontWeight="700"
      >
        local-first
      </text>
      <text
        x="17"
        y="89.5"
        textAnchor="middle"
        fontSize="4"
        fill="#34d399"
        fontFamily="monospace"
        opacity="0.7"
      >
        saves ~75% cost
      </text>

      {/* ── Animated routing pulse ────────────────────────────────────────── */}
      <circle r="2.5" fill="#fbbf24" opacity="0.9">
        <animateMotion dur="2.5s" repeatCount="indefinite" path="M59,50 L70,41" />
      </circle>
      <circle r="2.5" fill="#a78bfa" opacity="0.9">
        <animateMotion dur="3.5s" repeatCount="indefinite" begin="1s" path="M59,50 L70,63" />
      </circle>
    </svg>
  );
}
