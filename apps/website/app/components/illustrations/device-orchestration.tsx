/**
 * Device Orchestration illustration
 * Shows phones, camera, IoT sensor all connected to a central hub.
 * ~100×100px feel · works on dark backgrounds · minimal/iconic
 */
export function DeviceOrchestrationIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Central hub ─────────────────────────────────────────────────── */}
      {/* Hub glow */}
      <circle cx="50" cy="50" r="14" fill="rgba(6,182,212,0.12)" />
      {/* Hub ring */}
      <circle
        cx="50"
        cy="50"
        r="10"
        stroke="#22d3ee"
        strokeWidth="1.5"
        fill="rgba(6,182,212,0.08)"
      />
      {/* Hub dot */}
      <circle cx="50" cy="50" r="4" fill="#22d3ee" />

      {/* ── Connection lines (spokes) ────────────────────────────────────── */}
      {/* To phone top-left */}
      <line
        x1="43"
        y1="43"
        x2="26"
        y2="26"
        stroke="#22d3ee"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity="0.5"
      />
      {/* To camera top-right */}
      <line
        x1="57"
        y1="43"
        x2="74"
        y2="26"
        stroke="#06b6d4"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity="0.5"
      />
      {/* To IoT bottom-left */}
      <line
        x1="43"
        y1="57"
        x2="24"
        y2="72"
        stroke="#22d3ee"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity="0.5"
      />
      {/* To screen bottom-right */}
      <line
        x1="57"
        y1="57"
        x2="76"
        y2="72"
        stroke="#06b6d4"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity="0.5"
      />
      {/* To phone bottom-center */}
      <line
        x1="50"
        y1="60"
        x2="50"
        y2="76"
        stroke="#22d3ee"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity="0.5"
      />

      {/* ── Phone (top-left) ────────────────────────────────────────────── */}
      <g transform="translate(14, 14)">
        <rect
          x="0"
          y="0"
          width="14"
          height="22"
          rx="2.5"
          fill="rgba(34,211,238,0.10)"
          stroke="#22d3ee"
          strokeWidth="1.2"
        />
        {/* Screen */}
        <rect x="1.5" y="3" width="11" height="14" rx="1" fill="rgba(34,211,238,0.15)" />
        {/* Home button */}
        <circle cx="7" cy="19.5" r="1.5" fill="rgba(34,211,238,0.40)" />
        {/* Screen shimmer lines */}
        <line x1="3" y1="6" x2="11" y2="6" stroke="rgba(34,211,238,0.35)" strokeWidth="0.8" />
        <line x1="3" y1="9" x2="9" y2="9" stroke="rgba(34,211,238,0.25)" strokeWidth="0.8" />
      </g>

      {/* ── Camera (top-right) ──────────────────────────────────────────── */}
      <g transform="translate(68, 12)">
        {/* Camera body */}
        <rect
          x="0"
          y="4"
          width="20"
          height="14"
          rx="2.5"
          fill="rgba(6,182,212,0.10)"
          stroke="#06b6d4"
          strokeWidth="1.2"
        />
        {/* Lens */}
        <circle
          cx="10"
          cy="11"
          r="4.5"
          fill="rgba(6,182,212,0.08)"
          stroke="#06b6d4"
          strokeWidth="1"
        />
        <circle cx="10" cy="11" r="2.5" fill="rgba(6,182,212,0.20)" />
        {/* Flash */}
        <rect x="14.5" y="6" width="3" height="2" rx="0.5" fill="rgba(6,182,212,0.35)" />
        {/* Bump/mode dial */}
        <rect
          x="3"
          y="2"
          width="6"
          height="3"
          rx="1"
          fill="rgba(6,182,212,0.10)"
          stroke="#06b6d4"
          strokeWidth="0.8"
        />
      </g>

      {/* ── IoT Sensor (bottom-left) ────────────────────────────────────── */}
      <g transform="translate(14, 66)">
        {/* Sensor body */}
        <rect
          x="0"
          y="0"
          width="18"
          height="18"
          rx="3"
          fill="rgba(34,211,238,0.08)"
          stroke="#22d3ee"
          strokeWidth="1.2"
        />
        {/* Signal waves */}
        <path d="M4 14 Q9 8 14 14" stroke="#22d3ee" strokeWidth="1" fill="none" opacity="0.4" />
        <path d="M2 16 Q9 6 16 16" stroke="#22d3ee" strokeWidth="1" fill="none" opacity="0.25" />
        {/* Dot */}
        <circle cx="9" cy="13" r="1.5" fill="#22d3ee" opacity="0.7" />
        {/* Label lines */}
        <line x1="3" y1="3.5" x2="10" y2="3.5" stroke="rgba(34,211,238,0.3)" strokeWidth="0.8" />
        <line x1="3" y1="5.5" x2="8" y2="5.5" stroke="rgba(34,211,238,0.2)" strokeWidth="0.8" />
      </g>

      {/* ── Screen/Desktop (bottom-right) ───────────────────────────────── */}
      <g transform="translate(66, 66)">
        {/* Monitor */}
        <rect
          x="0"
          y="0"
          width="22"
          height="15"
          rx="2"
          fill="rgba(6,182,212,0.10)"
          stroke="#06b6d4"
          strokeWidth="1.2"
        />
        {/* Screen content */}
        <rect x="1.5" y="1.5" width="19" height="12" rx="1" fill="rgba(6,182,212,0.08)" />
        {/* Screen bars */}
        <line x1="3" y1="5" x2="18.5" y2="5" stroke="rgba(6,182,212,0.35)" strokeWidth="0.8" />
        <line x1="3" y1="8" x2="14" y2="8" stroke="rgba(6,182,212,0.25)" strokeWidth="0.8" />
        {/* Stand */}
        <rect x="9" y="15" width="4" height="3" rx="0.5" fill="rgba(6,182,212,0.20)" />
        <rect x="7" y="18" width="8" height="1.5" rx="0.5" fill="rgba(6,182,212,0.30)" />
      </g>

      {/* ── Phone (bottom-center) ───────────────────────────────────────── */}
      <g transform="translate(43.5, 76)">
        <rect
          x="0"
          y="0"
          width="13"
          height="20"
          rx="2"
          fill="rgba(34,211,238,0.10)"
          stroke="#22d3ee"
          strokeWidth="1.2"
        />
        <rect x="1.5" y="2.5" width="10" height="12" rx="0.8" fill="rgba(34,211,238,0.12)" />
        <circle cx="6.5" cy="17.5" r="1.2" fill="rgba(34,211,238,0.35)" />
      </g>

      {/* ── Pulse dots on connections ────────────────────────────────────── */}
      <circle cx="35" cy="35" r="2" fill="#22d3ee" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="64" cy="35" r="2" fill="#06b6d4" opacity="0.7">
        <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="37" cy="64" r="2" fill="#22d3ee" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
