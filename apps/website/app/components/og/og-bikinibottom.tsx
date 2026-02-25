/**
 * OG card for the BikiniBottom demo page.
 * Sandy yellow + ocean blue SpongeBob theme.
 *
 * 1200×630 · Design tokens: --bb-* (BikiniBottom palette)
 */

/** Mini SpongeBob face SVG for the card header decoration */
function SpongeBobIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Body */}
      <rect x="14" y="20" width="36" height="34" rx="6" fill="#f5c842" />
      {/* Pants */}
      <rect x="14" y="44" width="36" height="10" rx="3" fill="#4a3728" />
      {/* Belt */}
      <rect x="14" y="42" width="36" height="4" rx="2" fill="#7a5c3a" />
      {/* Eyes */}
      <circle cx="24" cy="30" r="5" fill="white" />
      <circle cx="40" cy="30" r="5" fill="white" />
      <circle cx="25" cy="31" r="3" fill="#3b82f6" />
      <circle cx="41" cy="31" r="3" fill="#3b82f6" />
      <circle cx="26" cy="30" r="1.5" fill="#1e3a8a" />
      <circle cx="42" cy="30" r="1.5" fill="#1e3a8a" />
      {/* Nose */}
      <ellipse cx="32" cy="35" rx="3" ry="2" fill="#e8a020" />
      {/* Smile */}
      <path d="M24 40 Q32 46 40 40" stroke="#1a1a0e" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Teeth */}
      <rect x="28" y="40" width="4" height="4" rx="1" fill="white" />
      <rect x="33" y="40" width="4" height="4" rx="1" fill="white" />
      {/* Arms */}
      <rect x="4" y="28" width="10" height="4" rx="2" fill="#f5c842" />
      <rect x="50" y="28" width="10" height="4" rx="2" fill="#f5c842" />
      {/* Legs */}
      <rect x="20" y="54" width="7" height="8" rx="2" fill="#f5c842" />
      <rect x="37" y="54" width="7" height="8" rx="2" fill="#f5c842" />
      {/* Shoes */}
      <ellipse cx="23" cy="62" rx="6" ry="3" fill="#4a3728" />
      <ellipse cx="41" cy="62" rx="6" ry="3" fill="#4a3728" />
      {/* Pores */}
      <circle cx="20" cy="26" r="1.5" fill="rgba(0,0,0,0.08)" />
      <circle cx="30" cy="24" r="1" fill="rgba(0,0,0,0.08)" />
      <circle cx="44" cy="28" r="1.5" fill="rgba(0,0,0,0.08)" />
      <circle cx="38" cy="36" r="1" fill="rgba(0,0,0,0.08)" />
    </svg>
  );
}

/** Small bubble decoration */
function Bubble({ x, y, r, opacity = 0.5 }: { x: number; y: number; r: number; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: `rgba(255,255,255,${opacity * 0.3})`,
        border: `1px solid rgba(255,255,255,${opacity * 0.6})`,
        pointerEvents: "none",
      }}
    />
  );
}

export function OgBikiniBottom() {
  const agents = [
    { name: "SpongeBob", emoji: "🧽", role: "CEO", dept: "Executive" },
    { name: "Patrick", emoji: "⭐", role: "CSO", dept: "Strategy" },
    { name: "Sandy", emoji: "🐿️", role: "CTO", dept: "Engineering" },
    { name: "Squidward", emoji: "🎺", role: "COO", dept: "Operations" },
    { name: "Mr. Krabs", emoji: "🦀", role: "CFO", dept: "Finance" },
    { name: "Gary", emoji: "🐌", role: "CIO", dept: "Intelligence" },
  ];

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        fontFamily: "var(--os-font-sans, system-ui, sans-serif)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        // Sandy gradient background
        background: "linear-gradient(160deg, #f5c842 0%, #e8a020 35%, #1a6ea8 65%, #0f4d7a 100%)",
      }}
    >
      {/* Ocean wave separator */}
      <svg
        viewBox="0 0 1200 80"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          top: 220,
          left: 0,
          right: 0,
          width: "100%",
          height: 80,
          pointerEvents: "none",
        }}
      >
        <path
          d="M0,40 C150,80 300,0 450,40 C600,80 750,0 900,40 C1050,80 1150,20 1200,40 L1200,80 L0,80 Z"
          fill="rgba(26,110,168,0.4)"
        />
      </svg>

      {/* Bubbles decoration */}
      <Bubble x={80} y={280} r={8} opacity={0.7} />
      <Bubble x={120} y={340} r={12} opacity={0.5} />
      <Bubble x={200} y={310} r={6} opacity={0.6} />
      <Bubble x={1050} y={260} r={10} opacity={0.6} />
      <Bubble x={1100} y={320} r={15} opacity={0.4} />
      <Bubble x={1130} y={280} r={6} opacity={0.7} />

      {/* Sand texture dots */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${((i * 41) % 100)}%`,
            top: `${20 + ((i * 37) % 30)}%`,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.06)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* ── Top section: Sandy area ───────────────────────────────────────── */}
      <div
        style={{
          padding: "44px 72px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          {/* Live badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.25)",
              border: "1px solid rgba(255,255,255,0.40)",
              borderRadius: 9999,
              padding: "5px 14px",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ef4444",
                display: "inline-block",
                animation: "pulse 1s infinite",
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#1a1a0e",
              }}
            >
              Live Demo · 24/7
            </span>
          </div>

          <h1
            style={{
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.0,
              margin: "0 0 10px",
              color: "#1a1a0e",
            }}
          >
            🍍 BikiniBottom
          </h1>

          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "rgba(26,26,14,0.75)",
              margin: "0 0 4px",
            }}
          >
            22 SpongeBob agents running a real company
          </p>
          <p style={{ fontSize: 17, color: "rgba(26,26,14,0.55)", margin: 0 }}>
            Powered by{" "}
            <strong style={{ color: "#1a1a0e" }}>OpenSpawn</strong> · 5 departments · Real-time
          </p>
        </div>

        {/* SpongeBob character */}
        <div style={{ marginTop: -8 }}>
          <SpongeBobIcon size={96} />
        </div>
      </div>

      {/* ── Bottom section: Ocean area ────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 320,
          background: "linear-gradient(180deg, rgba(15,77,122,0) 0%, #0f4d7a 30%)",
          padding: "60px 72px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* Agent cards row */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
          {agents.map((agent) => (
            <div
              key={agent.name}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.20)",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                backdropFilter: "blur(8px)",
              }}
            >
              <span style={{ fontSize: 22 }}>{agent.emoji}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.90)",
                  letterSpacing: "0.05em",
                }}
              >
                {agent.role}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                }}
              >
                {agent.name}
              </span>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: 32,
            padding: "14px 20px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
          }}
        >
          {[
            { label: "Agents", value: "22", color: "#f5c842" },
            { label: "Departments", value: "5", color: "#22d3ee" },
            { label: "Protocol", value: "ACP + A2A", color: "#a78bfa" },
            { label: "Status", value: "🟢 Live", color: "#34d399" },
            { label: "Platform", value: "OpenSpawn", color: "#fbbf24" },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
          <div style={{ marginLeft: "auto", alignSelf: "center" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255,255,255,0.55)",
                fontStyle: "italic",
              }}
            >
              bikinibottom.ai
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
