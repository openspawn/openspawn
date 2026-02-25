/**
 * ArchDiagram — SVG architecture diagram for the "How It Works" page.
 *
 * Replaces the ASCII art with a clean, dark-themed visual that shows:
 *   ORG.md → OpenSpawn Runtime → { Dashboard, Nodes, External Protocols }
 *   Nodes → { Camera, Screen, GPS, Notifications, Shell }
 */
export function ArchDiagram({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border border-navy-700 bg-[#0a1218] ${className}`}
      role="img"
      aria-label="OpenSpawn architecture diagram: ORG.md as source of truth flows into OpenSpawn Runtime, which connects to the Live Dashboard, physical Nodes (with camera, screen, GPS, notifications, and shell capabilities), and External Protocols (A2A and MCP)"
    >
      <svg
        viewBox="0 0 840 560"
        xmlns="http://www.w3.org/2000/svg"
        className="min-w-[600px] w-full max-w-full"
        style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}
      >
        <defs>
          {/* Connection arrow marker */}
          <marker
            id="arrowCyan"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L7,3 z" fill="#06b6d4" />
          </marker>
          <marker
            id="arrowViolet"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L7,3 z" fill="#8b5cf6" />
          </marker>
          <marker
            id="arrowSlate"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L7,3 z" fill="#475569" />
          </marker>

          {/* Glow filter for accent boxes */}
          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient fills */}
          <linearGradient id="gradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0e3044" />
            <stop offset="100%" stopColor="#0a1929" />
          </linearGradient>
          <linearGradient id="gradRuntime" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#122d4d" />
            <stop offset="100%" stopColor="#0d1f35" />
          </linearGradient>
          <linearGradient id="gradNodes" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1040" />
            <stop offset="100%" stopColor="#0d0d25" />
          </linearGradient>
        </defs>

        {/* ── Background ──────────────────────────────────────────────────── */}
        <rect width="840" height="560" fill="#0a1218" />

        {/* Subtle grid lines */}
        {[80, 160, 240, 320, 400, 480].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="840" y2={y} stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
        ))}
        {[120, 240, 360, 480, 600, 720].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="560" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
        ))}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* ROW 1 — ORG.md (Source of Truth) */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <g>
          {/* Box */}
          <rect
            x="290" y="20" width="260" height="72"
            rx="10" ry="10"
            fill="url(#gradCyan)"
            stroke="#06b6d4"
            strokeWidth="1.5"
            filter="url(#glowCyan)"
          />
          {/* Top label */}
          <rect x="330" y="12" width="180" height="18" rx="4" fill="#06b6d4" />
          <text x="420" y="25" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0a1929" letterSpacing="1">
            SOURCE OF TRUTH
          </text>

          {/* Title */}
          <text x="420" y="52" textAnchor="middle" fontSize="20" fontWeight="700" fill="#22d3ee" letterSpacing="-0.5">
            ORG.md
          </text>
          <text x="420" y="72" textAnchor="middle" fontSize="11" fill="#94a3b8">
            agents · hierarchy · models · policies
          </text>
        </g>

        {/* ── Arrow: ORG.md → Runtime ──────────────────────────────────────── */}
        <line
          x1="420" y1="92" x2="420" y2="130"
          stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 3"
          markerEnd="url(#arrowCyan)"
        />
        <text x="432" y="115" fontSize="9" fill="#475569">defines</text>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* ROW 2 — OpenSpawn Runtime */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <g>
          <rect
            x="80" y="132" width="680" height="136"
            rx="12" ry="12"
            fill="url(#gradRuntime)"
            stroke="#1a3a5c"
            strokeWidth="1.5"
          />
          {/* Runtime label */}
          <text x="420" y="155" textAnchor="middle" fontSize="13" fontWeight="700" fill="#f1f5f9" letterSpacing="0.5">
            OpenSpawn Runtime
          </text>
          <text x="420" y="172" textAnchor="middle" fontSize="10" fill="#64748b">
            core engine
          </text>

          {/* Internal modules — 3 boxes in a row */}
          {/* Simulation Engine */}
          <rect x="108" y="182" width="168" height="68" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="192" y="205" textAnchor="middle" fontSize="11" fontWeight="600" fill="#94a3b8">Simulation Engine</text>
          <text x="192" y="220" textAnchor="middle" fontSize="9.5" fill="#64748b">tick / events</text>
          <text x="192" y="234" textAnchor="middle" fontSize="9.5" fill="#64748b">decision cycle</text>

          {/* ACP Message Bus */}
          <rect x="336" y="182" width="168" height="68" rx="8" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.20)" strokeWidth="1" />
          <text x="420" y="205" textAnchor="middle" fontSize="11" fontWeight="600" fill="#22d3ee">ACP Message Bus</text>
          <text x="420" y="220" textAnchor="middle" fontSize="9.5" fill="#64748b">ack · progress</text>
          <text x="420" y="234" textAnchor="middle" fontSize="9.5" fill="#64748b">escalate · complete</text>

          {/* Model Router */}
          <rect x="564" y="182" width="168" height="68" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="648" y="205" textAnchor="middle" fontSize="11" fontWeight="600" fill="#94a3b8">Model Router</text>
          <text x="648" y="220" textAnchor="middle" fontSize="9.5" fill="#64748b">Opus / Sonnet</text>
          <text x="648" y="234" textAnchor="middle" fontSize="9.5" fill="#64748b">Haiku / Ollama</text>
        </g>

        {/* ── Arrows from Runtime → 3 outputs ─────────────────────────────── */}

        {/* → Dashboard (left branch) */}
        <path
          d="M 200 268 L 200 310 L 168 310 L 168 352"
          stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeDasharray="4 3"
          markerEnd="url(#arrowCyan)"
        />

        {/* → External Protocols (right branch) */}
        <path
          d="M 640 268 L 640 310 L 672 310 L 672 352"
          stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeDasharray="4 3"
          markerEnd="url(#arrowViolet)"
        />

        {/* → Nodes (center branch) */}
        <line
          x1="420" y1="268" x2="420" y2="352"
          stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3"
          markerEnd="url(#arrowViolet)"
        />

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* ROW 3 — Three output boxes */}
        {/* ────────────────────────────────────────────────────────────────── */}

        {/* Dashboard (left) */}
        <g>
          <rect
            x="60" y="352" width="216" height="134"
            rx="10" ry="10"
            fill="rgba(6,182,212,0.05)"
            stroke="rgba(6,182,212,0.25)"
            strokeWidth="1.5"
          />
          <text x="168" y="376" textAnchor="middle" fontSize="12" fontWeight="700" fill="#22d3ee">Dashboard</text>
          <text x="168" y="392" textAnchor="middle" fontSize="10" fill="#64748b">web UI</text>

          {[
            { y: 412, icon: "📊", label: "Org chart & network graph" },
            { y: 430, icon: "📋", label: "Task timeline" },
            { y: 448, icon: "💬", label: "Message stream" },
            { y: 466, icon: "💰", label: "Cost tracker" },
          ].map(({ y, icon, label }) => (
            <g key={y}>
              <text x="88" y={y} fontSize="11">{icon}</text>
              <text x="108" y={y} fontSize="10" fill="#94a3b8">{label}</text>
            </g>
          ))}
        </g>

        {/* Nodes (center) */}
        <g>
          <rect
            x="300" y="352" width="240" height="134"
            rx="10" ry="10"
            fill="rgba(139,92,246,0.06)"
            stroke="rgba(139,92,246,0.30)"
            strokeWidth="1.5"
          />
          <text x="420" y="376" textAnchor="middle" fontSize="12" fontWeight="700" fill="#a78bfa">Nodes</text>
          <text x="420" y="392" textAnchor="middle" fontSize="10" fill="#64748b">physical devices</text>

          {[
            { y: 412, icon: "📸", label: "Camera" },
            { y: 430, icon: "🖥️", label: "Screen" },
            { y: 448, icon: "📍", label: "GPS location" },
            { y: 466, icon: "🔔", label: "Notifications" },
            { y: 484, icon: "💻", label: "Shell commands" },
          ].map(({ y, icon, label }) => (
            <g key={y}>
              <text x="346" y={y} fontSize="11">{icon}</text>
              <text x="368" y={y} fontSize="10" fill="#94a3b8">{label}</text>
            </g>
          ))}
        </g>

        {/* External Protocols (right) */}
        <g>
          <rect
            x="564" y="352" width="216" height="134"
            rx="10" ry="10"
            fill="rgba(139,92,246,0.05)"
            stroke="rgba(139,92,246,0.25)"
            strokeWidth="1.5"
          />
          <text x="672" y="376" textAnchor="middle" fontSize="12" fontWeight="700" fill="#a78bfa">External Protocols</text>

          {[
            { y: 408, icon: "🔗", label: "A2A", desc: "Agent-to-Agent" },
            { y: 434, icon: "🔌", label: "MCP", desc: "Tool Server" },
          ].map(({ y, icon, label, desc }) => (
            <g key={y}>
              <rect x="590" y={y - 14} width="164" height="24" rx="5"
                fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x="608" y={y + 1} fontSize="11">{icon}</text>
              <text x="626" y={y + 1} fontSize="10" fontWeight="600" fill="#a78bfa">{label}</text>
              <text x="664" y={y + 1} fontSize="9.5" fill="#64748b"> — {desc}</text>
            </g>
          ))}

          <text x="672" y="470" textAnchor="middle" fontSize="10" fill="#475569">LangGraph · CrewAI</text>
          <text x="672" y="485" textAnchor="middle" fontSize="10" fill="#475569">Claude Desktop · AutoGen</text>
        </g>

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        <g>
          <text x="420" y="524" textAnchor="middle" fontSize="9" fill="#334155" letterSpacing="0.5">
            ─ ─  data flow
          </text>

          {/* Left legend */}
          <line x1="52" y1="520" x2="72" y2="520" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="76" y="524" fontSize="9" fill="#475569">runtime → UI</text>

          {/* Right legend */}
          <line x1="696" y1="520" x2="716" y2="520" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="720" y="524" fontSize="9" fill="#475569">runtime → protocols</text>
        </g>
      </svg>
    </div>
  );
}
