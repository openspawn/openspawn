/**
 * ORG.md illustration
 * Shows markdown syntax transforming into an org-chart hierarchy.
 * ~100×100px feel · dark backgrounds · minimal/iconic
 */
export function OrgMdIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Markdown side (left 40%) ─────────────────────────────────────── */}
      {/* Document card */}
      <rect x="4" y="8" width="36" height="50" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* Markdown heading # */}
      <text x="8" y="20" fontSize="8" fill="#22d3ee" fontFamily="monospace" fontWeight="800"># Org</text>
      {/* ## Teams */}
      <text x="8" y="30" fontSize="6.5" fill="#a78bfa" fontFamily="monospace" fontWeight="700">## Teams</text>
      {/* - list items */}
      <text x="8" y="38" fontSize="5.5" fill="#94a3b8" fontFamily="monospace">- 🔬 Research</text>
      <text x="8" y="45" fontSize="5.5" fill="#94a3b8" fontFamily="monospace">- 🛠 Engineering</text>
      {/* ## Policies */}
      <text x="8" y="53" fontSize="6" fill="#a78bfa" fontFamily="monospace" fontWeight="700">## Policies</text>

      {/* ── Arrow ───────────────────────────────────────────────────────── */}
      {/* Arrow shaft */}
      <line x1="42" y1="33" x2="57" y2="33" stroke="#22d3ee" strokeWidth="1.5" />
      {/* Arrowhead */}
      <path d="M54,29.5 L58,33 L54,36.5" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Small label */}
      <text x="49.5" y="28" textAnchor="middle" fontSize="5" fill="#22d3ee" fontFamily="monospace">parse</text>

      {/* ── Org chart side (right 40%) ───────────────────────────────────── */}
      {/* COO top node */}
      <rect x="64" y="8" width="28" height="12" rx="3" fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="1.2" />
      <text x="78" y="16.5" textAnchor="middle" fontSize="6" fill="#22d3ee" fontFamily="monospace" fontWeight="700">COO</text>

      {/* Vertical stem from COO */}
      <line x1="78" y1="20" x2="78" y2="28" stroke="rgba(34,211,238,0.35)" strokeWidth="1" />

      {/* Horizontal bar */}
      <line x1="62" y1="28" x2="94" y2="28" stroke="rgba(34,211,238,0.35)" strokeWidth="1" />

      {/* Down stems */}
      <line x1="66" y1="28" x2="66" y2="35" stroke="rgba(34,211,238,0.35)" strokeWidth="1" />
      <line x1="90" y1="28" x2="90" y2="35" stroke="rgba(34,211,238,0.35)" strokeWidth="1" />

      {/* Research lead node */}
      <rect x="54" y="35" width="24" height="10" rx="2.5" fill="rgba(167,139,250,0.10)" stroke="#a78bfa" strokeWidth="1" />
      <text x="66" y="42" textAnchor="middle" fontSize="5.5" fill="#a78bfa" fontFamily="monospace" fontWeight="600">🔬 Res.</text>

      {/* Engineering lead node */}
      <rect x="79" y="35" width="24" height="10" rx="2.5" fill="rgba(167,139,250,0.10)" stroke="#a78bfa" strokeWidth="1" />
      <text x="91" y="42" textAnchor="middle" fontSize="5.5" fill="#a78bfa" fontFamily="monospace" fontWeight="600">🛠 Eng.</text>

      {/* Worker nodes */}
      <line x1="66" y1="45" x2="66" y2="52" stroke="rgba(167,139,250,0.30)" strokeWidth="0.8" />
      <line x1="91" y1="45" x2="91" y2="52" stroke="rgba(167,139,250,0.30)" strokeWidth="0.8" />
      <line x1="87" y1="52" x2="95" y2="52" stroke="rgba(167,139,250,0.30)" strokeWidth="0.8" />
      <line x1="87" y1="52" x2="87" y2="57" stroke="rgba(167,139,250,0.30)" strokeWidth="0.8" />
      <line x1="95" y1="52" x2="95" y2="57" stroke="rgba(167,139,250,0.30)" strokeWidth="0.8" />

      {/* Worker leaf */}
      <rect x="59" y="52" width="14" height="8" rx="2" fill="rgba(100,116,139,0.10)" stroke="#475569" strokeWidth="0.8" />
      <text x="66" y="58" textAnchor="middle" fontSize="5" fill="#64748b" fontFamily="monospace">Scout</text>

      {/* Eng workers */}
      <rect x="83" y="57" width="8" height="7" rx="1.5" fill="rgba(100,116,139,0.10)" stroke="#475569" strokeWidth="0.8" />
      <text x="87" y="62.5" textAnchor="middle" fontSize="4.5" fill="#64748b" fontFamily="monospace">W1</text>
      <rect x="92" y="57" width="8" height="7" rx="1.5" fill="rgba(100,116,139,0.10)" stroke="#475569" strokeWidth="0.8" />
      <text x="96" y="62.5" textAnchor="middle" fontSize="4.5" fill="#64748b" fontFamily="monospace">W2</text>

      {/* ── Bottom label bar ──────────────────────────────────────────────── */}
      <rect x="4" y="72" width="92" height="16" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
      <text x="50" y="83" textAnchor="middle" fontSize="6" fill="#64748b" fontFamily="monospace">
        ORG.md  →  parsed  →  live org chart
      </text>

      {/* ── Git diff decoration ───────────────────────────────────────────── */}
      <rect x="4" y="91" width="92" height="6" rx="2" fill="rgba(16,185,129,0.06)" />
      <text x="7" y="96" fontSize="5" fill="#10b981" fontFamily="monospace" opacity="0.7">+ version controlled · diffable · portable</text>
    </svg>
  );
}
