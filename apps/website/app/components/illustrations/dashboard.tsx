/**
 * Dashboard / Live Monitoring illustration
 * Shows a mini dashboard with network graph, task timeline, and health metrics.
 * ~100×100px feel · dark backgrounds · minimal/iconic
 */
export function DashboardIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Outer browser/dashboard chrome ──────────────────────────────── */}
      <rect x="2" y="2" width="96" height="96" rx="6" fill="rgba(13,33,55,0.80)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* Title bar */}
      <rect x="2" y="2" width="96" height="14" rx="6" fill="rgba(18,45,77,0.90)" />
      <rect x="2" y="10" width="96" height="6" fill="rgba(18,45,77,0.90)" />
      {/* Traffic lights */}
      <circle cx="10" cy="9" r="2.5" fill="rgba(239,68,68,0.60)" />
      <circle cx="17" cy="9" r="2.5" fill="rgba(245,158,11,0.60)" />
      <circle cx="24" cy="9" r="2.5" fill="rgba(34,211,238,0.50)" />
      {/* URL bar */}
      <rect x="32" y="6" width="60" height="6" rx="3" fill="rgba(255,255,255,0.04)" />
      <text x="62" y="10.5" textAnchor="middle" fontSize="4" fill="#64748b" fontFamily="monospace">
        localhost:3333/app/
      </text>
      {/* Live badge */}
      <circle cx="90" cy="9" r="2" fill="#34d399">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* ── Health bar ───────────────────────────────────────────────────── */}
      <rect x="6" y="19" width="88" height="10" rx="2" fill="rgba(255,255,255,0.02)" />
      <text x="8" y="25.5" fontSize="4.5" fill="#64748b" fontFamily="monospace">Health</text>
      <rect x="28" y="21" width="50" height="6" rx="2" fill="rgba(255,255,255,0.04)" />
      <rect x="28" y="21" width="41" height="6" rx="2" fill="rgba(34,211,238,0.25)" />
      <text x="30" y="25.5" fontSize="4" fill="#22d3ee" fontFamily="monospace" fontWeight="700">82%</text>
      <text x="82" y="25.5" fontSize="4.5" fill="#34d399" fontFamily="monospace" fontWeight="700">● HEALTHY</text>

      {/* ── Left panel: Network graph ─────────────────────────────────────── */}
      <rect x="6" y="32" width="44" height="40" rx="3" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      <text x="28" y="38" textAnchor="middle" fontSize="4.5" fill="#64748b" fontFamily="monospace">Network</text>

      {/* COO node */}
      <circle cx="28" cy="48" r="5" fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="1.2" />
      <circle cx="28" cy="48" r="2" fill="#22d3ee">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Department nodes + connections */}
      <line x1="28" y1="53" x2="17" y2="64" stroke="rgba(167,139,250,0.35)" strokeWidth="0.8" />
      <line x1="28" y1="53" x2="39" y2="64" stroke="rgba(167,139,250,0.35)" strokeWidth="0.8" />
      <circle cx="17" cy="64" r="3.5" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1" />
      <circle cx="17" cy="64" r="1.5" fill="#a78bfa" />
      <circle cx="39" cy="64" r="3.5" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1" />
      <circle cx="39" cy="64" r="1.5" fill="#a78bfa" />

      {/* Worker nodes */}
      <line x1="17" y1="67.5" x2="10" y2="72" stroke="rgba(100,116,139,0.30)" strokeWidth="0.8" />
      <line x1="39" y1="67.5" x2="33" y2="72" stroke="rgba(100,116,139,0.30)" strokeWidth="0.8" />
      <line x1="39" y1="67.5" x2="44" y2="72" stroke="rgba(100,116,139,0.30)" strokeWidth="0.8" />
      <circle cx="10" cy="72" r="2" fill="rgba(100,116,139,0.20)" stroke="#475569" strokeWidth="0.8" />
      <circle cx="33" cy="72" r="2" fill="rgba(100,116,139,0.20)" stroke="#475569" strokeWidth="0.8" />
      <circle cx="44" cy="72" r="2" fill="rgba(52,211,153,0.20)" stroke="#34d399" strokeWidth="0.8">
        <animate attributeName="opacity" values="1;0.5;1" dur="1.2s" repeatCount="indefinite" />
      </circle>

      {/* ── Right panel: Task timeline ────────────────────────────────────── */}
      <rect x="54" y="32" width="40" height="40" rx="3" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      <text x="74" y="38" textAnchor="middle" fontSize="4.5" fill="#64748b" fontFamily="monospace">Tasks</text>

      {/* Task rows */}
      {[
        { label: "Build API", status: "✅", color: "#34d399", y: 44 },
        { label: "Write docs", status: "⚙", color: "#fbbf24", y: 52 },
        { label: "Review PR", status: "⚙", color: "#fbbf24", y: 60 },
        { label: "Deploy", status: "⏳", color: "#64748b", y: 68 },
      ].map((task) => (
        <g key={task.label}>
          <rect x="56" y={task.y - 1} width="36" height="7" rx="1.5" fill="rgba(255,255,255,0.02)" />
          <text x="58" y={task.y + 4.5} fontSize="4.5" fill={task.color} fontFamily="monospace">
            {task.status}
          </text>
          <text x="64" y={task.y + 4.5} fontSize="4" fill="#94a3b8" fontFamily="monospace">
            {task.label}
          </text>
        </g>
      ))}

      {/* ── Bottom stats bar ──────────────────────────────────────────────── */}
      <rect x="6" y="76" width="88" height="20" rx="3" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      {/* Stats */}
      {[
        { label: "Agents", value: "22", color: "#22d3ee", x: 16 },
        { label: "Active", value: "8", color: "#34d399", x: 37 },
        { label: "Tasks", value: "47", color: "#fbbf24", x: 57 },
        { label: "Cost", value: "$0.08", color: "#a78bfa", x: 79 },
      ].map((stat) => (
        <g key={stat.label}>
          <text x={stat.x} y="85" textAnchor="middle" fontSize="8" fill={stat.color} fontFamily="monospace" fontWeight="800">
            {stat.value}
          </text>
          <text x={stat.x} y="92" textAnchor="middle" fontSize="4" fill="#64748b" fontFamily="monospace">
            {stat.label}
          </text>
        </g>
      ))}
      {/* Dividers */}
      <line x1="28" y1="78" x2="28" y2="94" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      <line x1="48" y1="78" x2="48" y2="94" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      <line x1="68" y1="78" x2="68" y2="94" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
    </svg>
  );
}
