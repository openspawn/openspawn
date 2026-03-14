/**
 * OG card for the main OpenSpawn site.
 * Renders as a 1200×630 styled div — screenshot this for the actual og:image.
 *
 * Design tokens used: --os-* (dark-navy OpenSpawn palette)
 */
export function OgOpenspawn() {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: "var(--os-bg-base, #0a1929)",
        fontFamily: "var(--os-font-sans, system-ui, sans-serif)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "64px 80px",
        boxSizing: "border-box",
      }}
    >
      {/* ── Background gradient blobs ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -40,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(6,182,212,0.10)",
            border: "1px solid rgba(6,182,212,0.25)",
            borderRadius: 9999,
            padding: "6px 16px",
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 20 }}>🐙</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--os-accent-light, #22d3ee)",
            }}
          >
            Multi-Agent Platform
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.05,
            margin: "0 0 20px",
            background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 50%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          OpenSpawn
        </h1>

        {/* Sub-tagline */}
        <p
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "var(--os-text-primary, #f1f5f9)",
            margin: "0 0 12px",
            lineHeight: 1.2,
          }}
        >
          Your agents. Your devices. Your rules.
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 20,
            color: "var(--os-text-secondary, #94a3b8)",
            margin: "0 0 40px",
            lineHeight: 1.5,
          }}
        >
          Orchestrate real-world AI agent orgs across phones, cameras, screens, and IoT — with the
          structure your team actually needs.
        </p>

        {/* Protocol pills */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["A2A Protocol", "MCP", "Model Router", "Device Nodes", "TypeScript", "Python"].map(
            (label) => (
              <span
                key={label}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--os-text-body, #cbd5e1)",
                  fontFamily: "var(--os-font-mono, monospace)",
                }}
              >
                {label}
              </span>
            ),
          )}
        </div>
      </div>

      {/* ── Right side: terminal snippet ──────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: "50%",
          transform: "translateY(-50%)",
          width: 360,
          background: "var(--os-bg-code, #0d1117)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            background: "var(--os-bg-code-header, #161b22)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff5f57",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#febc2e",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#28c840",
              display: "inline-block",
            }}
          />
          <span style={{ marginLeft: 8, fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
            terminal
          </span>
        </div>
        {/* Terminal content */}
        <pre
          style={{
            padding: "20px 20px",
            margin: 0,
            fontSize: 13,
            fontFamily: "var(--os-font-mono, monospace)",
            lineHeight: 1.8,
            color: "#cbd5e1",
          }}
        >
          <span style={{ color: "#64748b" }}>$ </span>
          <span style={{ color: "#22d3ee" }}>npx openspawn init my-org</span>
          {"\n"}
          <span style={{ color: "#34d399" }}>✓ </span>Found 5 agents{"\n"}
          <span style={{ color: "#34d399" }}>✓ </span>Applied culture: startup{"\n"}
          <span style={{ color: "#34d399" }}>✓ </span>Loaded policies{"\n"}
          <span style={{ color: "#34d399" }}>✓ </span>Dashboard running{"\n"}
          {"  "}
          <span style={{ color: "#64748b" }}>→ </span>
          <span style={{ color: "#a78bfa" }}>localhost:3333</span>
        </pre>
      </div>

      {/* ── Footer bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, #22d3ee, #a78bfa, #fbbf24)",
        }}
      />
    </div>
  );
}
