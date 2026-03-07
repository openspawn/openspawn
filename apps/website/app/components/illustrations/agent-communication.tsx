/**
 * Agent Communication / ACP illustration
 * Shows two agent nodes exchanging messages via ACP.
 * Message flow: DELEGATE → ACK → UPDATE → COMPLETE
 * ~100×100px feel · dark backgrounds · minimal/iconic
 */
export function AgentCommunicationIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Left agent node ─────────────────────────────────────────────── */}
      <g transform="translate(8, 30)">
        {/* Glow */}
        <circle cx="14" cy="16" r="14" fill="rgba(139,92,246,0.10)" />
        {/* Outer ring */}
        <circle
          cx="14"
          cy="16"
          r="10"
          stroke="#a78bfa"
          strokeWidth="1.5"
          fill="rgba(139,92,246,0.08)"
        />
        {/* Inner dot */}
        <circle cx="14" cy="16" r="4" fill="#8b5cf6" />
        {/* Agent label */}
        <text
          x="14"
          y="33"
          textAnchor="middle"
          fontSize="7"
          fill="#a78bfa"
          fontFamily="monospace"
          fontWeight="700"
        >
          COO
        </text>
      </g>

      {/* ── Right agent node ─────────────────────────────────────────────── */}
      <g transform="translate(68, 30)">
        {/* Glow */}
        <circle cx="14" cy="16" r="14" fill="rgba(139,92,246,0.10)" />
        {/* Outer ring */}
        <circle
          cx="14"
          cy="16"
          r="10"
          stroke="#a78bfa"
          strokeWidth="1.5"
          fill="rgba(139,92,246,0.08)"
        />
        {/* Inner dot */}
        <circle cx="14" cy="16" r="4" fill="#8b5cf6" />
        {/* Agent label */}
        <text
          x="14"
          y="33"
          textAnchor="middle"
          fontSize="7"
          fill="#a78bfa"
          fontFamily="monospace"
          fontWeight="700"
        >
          ENG
        </text>
      </g>

      {/* ── ACP message flow (arrows + pills) ───────────────────────────── */}
      {/* Arrow 1: DELEGATE (top, left→right) */}
      <g transform="translate(0, 18)">
        {/* Line */}
        <line x1="32" y1="0" x2="68" y2="0" stroke="#a78bfa" strokeWidth="1" opacity="0.5" />
        {/* Arrowhead */}
        <path
          d="M65,-3 L69,0 L65,3"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Label pill */}
        <rect
          x="38"
          y="-9"
          width="24"
          height="9"
          rx="4.5"
          fill="rgba(139,92,246,0.15)"
          stroke="rgba(139,92,246,0.30)"
          strokeWidth="0.5"
        />
        <text
          x="50"
          y="-2.5"
          textAnchor="middle"
          fontSize="5.5"
          fill="#a78bfa"
          fontFamily="monospace"
          fontWeight="700"
        >
          DELEGATE
        </text>
      </g>

      {/* Arrow 2: ACK (right→left) */}
      <g transform="translate(0, 32)">
        <line x1="68" y1="0" x2="32" y2="0" stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
        <path
          d="M35,-3 L31,0 L35,3"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <rect
          x="41"
          y="-9"
          width="18"
          height="9"
          rx="4.5"
          fill="rgba(6,182,212,0.10)"
          stroke="rgba(6,182,212,0.25)"
          strokeWidth="0.5"
        />
        <text
          x="50"
          y="-2.5"
          textAnchor="middle"
          fontSize="5.5"
          fill="#22d3ee"
          fontFamily="monospace"
          fontWeight="700"
        >
          ACK 👍
        </text>
      </g>

      {/* Arrow 3: UPDATE (right→left) */}
      <g transform="translate(0, 46)">
        <line x1="68" y1="0" x2="32" y2="0" stroke="#fbbf24" strokeWidth="1" opacity="0.45" />
        <path
          d="M35,-3 L31,0 L35,3"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <rect
          x="38"
          y="-9"
          width="24"
          height="9"
          rx="4.5"
          fill="rgba(245,158,11,0.10)"
          stroke="rgba(245,158,11,0.25)"
          strokeWidth="0.5"
        />
        <text
          x="50"
          y="-2.5"
          textAnchor="middle"
          fontSize="5.5"
          fill="#fbbf24"
          fontFamily="monospace"
          fontWeight="700"
        >
          UPDATE 📊
        </text>
      </g>

      {/* Arrow 4: COMPLETE (right→left) */}
      <g transform="translate(0, 60)">
        <line x1="68" y1="0" x2="32" y2="0" stroke="#34d399" strokeWidth="1.5" opacity="0.6" />
        <path
          d="M35,-3 L31,0 L35,3"
          fill="none"
          stroke="#34d399"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect
          x="37"
          y="-9"
          width="26"
          height="9"
          rx="4.5"
          fill="rgba(16,185,129,0.12)"
          stroke="rgba(16,185,129,0.30)"
          strokeWidth="0.5"
        />
        <text
          x="50"
          y="-2.5"
          textAnchor="middle"
          fontSize="5.5"
          fill="#34d399"
          fontFamily="monospace"
          fontWeight="700"
        >
          COMPLETE ✅
        </text>
      </g>

      {/* ── Bottom label: ACP ──────────────────────────────────────────── */}
      <g transform="translate(0, 76)">
        <rect
          x="30"
          y="0"
          width="40"
          height="12"
          rx="4"
          fill="rgba(139,92,246,0.08)"
          stroke="rgba(139,92,246,0.20)"
          strokeWidth="0.8"
        />
        <text
          x="50"
          y="8.5"
          textAnchor="middle"
          fontSize="6"
          fill="#a78bfa"
          fontFamily="monospace"
          fontWeight="700"
          letterSpacing="0.5"
        >
          Agent Comm Protocol
        </text>
      </g>

      {/* ── Moving pulse dots ─────────────────────────────────────────── */}
      <circle r="2.5" fill="#a78bfa" opacity="0.8">
        <animateMotion dur="3s" repeatCount="indefinite" path="M32,18 L68,18" />
      </circle>
      <circle r="2.5" fill="#34d399" opacity="0.8">
        <animateMotion dur="4s" repeatCount="indefinite" path="M68,60 L32,60" />
      </circle>
    </svg>
  );
}
