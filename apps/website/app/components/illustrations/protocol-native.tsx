/**
 * Protocol Native illustration
 * Shows A2A and MCP protocols bridging two ecosystems.
 * Clean socket-and-wire feel, two-sided: "Agents" ↔ "Clients"
 * ~100×100px feel · dark backgrounds · minimal/iconic
 */
export function ProtocolNativeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Left column: OpenSpawn agents ──────────────────────────────── */}
      {/* Column header */}
      <rect x="2" y="4" width="28" height="9" rx="3" fill="rgba(139,92,246,0.10)" stroke="rgba(139,92,246,0.25)" strokeWidth="0.8" />
      <text x="16" y="10" textAnchor="middle" fontSize="5.5" fill="#a78bfa" fontFamily="monospace" fontWeight="700">OpenSpawn</text>

      {/* Agent pills */}
      {[
        { label: "COO", y: 17, active: true },
        { label: "Lead", y: 29, active: true },
        { label: "Worker", y: 41, active: false },
        { label: "Worker", y: 53, active: false },
      ].map((agent) => (
        <g key={`${agent.label}-${agent.y}`}>
          <rect
            x="2"
            y={agent.y}
            width="28"
            height="10"
            rx="2.5"
            fill={agent.active ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)"}
            stroke={agent.active ? "#a78bfa" : "rgba(255,255,255,0.07)"}
            strokeWidth="0.8"
          />
          {/* Status dot */}
          <circle
            cx="7"
            cy={agent.y + 5}
            r="2"
            fill={agent.active ? "#a78bfa" : "#334155"}
          >
            {agent.active && (
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            )}
          </circle>
          <text x="16" y={agent.y + 7} textAnchor="middle" fontSize="5" fill={agent.active ? "#a78bfa" : "#475569"} fontFamily="monospace">
            {agent.label}
          </text>
        </g>
      ))}

      {/* ── Center: Protocol bridge ─────────────────────────────────────── */}
      {/* A2A protocol block */}
      <rect x="34" y="12" width="32" height="32" rx="5" fill="rgba(18,45,77,0.90)" stroke="#8b5cf6" strokeWidth="1.5" />
      {/* A2A label */}
      <text x="50" y="26" textAnchor="middle" fontSize="9" fill="#a78bfa" fontFamily="monospace" fontWeight="900">A2A</text>
      <text x="50" y="35" textAnchor="middle" fontSize="5" fill="#64748b" fontFamily="monospace">Protocol</text>

      {/* MCP protocol block */}
      <rect x="34" y="56" width="32" height="32" rx="5" fill="rgba(18,45,77,0.90)" stroke="#22d3ee" strokeWidth="1.5" />
      {/* MCP label */}
      <text x="50" y="70" textAnchor="middle" fontSize="9" fill="#22d3ee" fontFamily="monospace" fontWeight="900">MCP</text>
      <text x="50" y="79" textAnchor="middle" fontSize="5" fill="#64748b" fontFamily="monospace">7 tools</text>

      {/* Protocol separator */}
      <line x1="38" y1="50" x2="62" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* ── Connection lines: agents → protocols ────────────────────────── */}
      {[22, 34, 46, 58].map((y) => (
        <line key={y} x1="30" y1={y} x2="34" y2={y < 50 ? 28 : 72} stroke="rgba(139,92,246,0.30)" strokeWidth="0.8" />
      ))}

      {/* ── Right column: External clients ─────────────────────────────── */}
      {/* Column header */}
      <rect x="70" y="4" width="28" height="9" rx="3" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.20)" strokeWidth="0.8" />
      <text x="84" y="10" textAnchor="middle" fontSize="5.5" fill="#22d3ee" fontFamily="monospace" fontWeight="700">Clients</text>

      {/* Client pills */}
      {[
        { label: "Claude", y: 17, emoji: "🤖" },
        { label: "Cursor", y: 29, emoji: "⌨️" },
        { label: "Custom", y: 41, emoji: "🔧" },
        { label: "Any A2A", y: 53, emoji: "🌐" },
      ].map((client) => (
        <g key={client.label}>
          <rect x="70" y={client.y} width="28" height="10" rx="2.5" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.15)" strokeWidth="0.8" />
          <text x="84" y={client.y + 7} textAnchor="middle" fontSize="5" fill="#64748b" fontFamily="monospace">
            {client.label}
          </text>
        </g>
      ))}

      {/* ── Connection lines: protocols → clients ────────────────────────── */}
      {[22, 34].map((y) => (
        <line key={`a2a-${y}`} x1="66" y1="28" x2="70" y2={y} stroke="rgba(139,92,246,0.30)" strokeWidth="0.8" />
      ))}
      {[41, 53].map((y) => (
        <line key={`mcp-${y}`} x1="66" y1="72" x2="70" y2={y} stroke="rgba(6,182,212,0.30)" strokeWidth="0.8" />
      ))}

      {/* ── Discovery endpoint decoration ──────────────────────────────── */}
      <rect x="4" y="70" width="28" height="20" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
      <text x="18" y="77" textAnchor="middle" fontSize="4" fill="#64748b" fontFamily="monospace">.well-known/</text>
      <text x="18" y="83" textAnchor="middle" fontSize="4" fill="#22d3ee" fontFamily="monospace">agent.json</text>
      <text x="18" y="88" textAnchor="middle" fontSize="3.5" fill="#475569" fontFamily="monospace">auto-published</text>

      {/* ── Animated data packets ─────────────────────────────────────────── */}
      <circle r="2" fill="#a78bfa" opacity="0.9">
        <animateMotion dur="2s" repeatCount="indefinite" path="M30,22 L34,28" />
      </circle>
      <circle r="2" fill="#22d3ee" opacity="0.9">
        <animateMotion dur="2.5s" repeatCount="indefinite" begin="0.5s" path="M66,72 L70,41" />
      </circle>
    </svg>
  );
}
