/**
 * OG card for the Getting Started / Tutorial pages.
 * Tutorial-focused: emphasizes the step-by-step journey.
 *
 * 1200×630 · Design tokens: --os-* (OpenSpawn dark palette)
 */
export function OgGettingStarted() {
  const steps = [
    { n: "1", label: "Scaffold your org", cmd: "npx openspawn init" },
    { n: "2", label: "Start the server", cmd: "npx openspawn start" },
    { n: "3", label: "Send your first task", cmd: "POST /a2a/message/send" },
    { n: "4", label: "Watch the dashboard", cmd: "localhost:3333/app/" },
  ];

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
        padding: "56px 80px",
        boxSizing: "border-box",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 700,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, #22d3ee, #a78bfa, #fbbf24)",
        }}
      />

      {/* ── Top row: breadcrumb ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 32,
          color: "var(--os-text-secondary, #94a3b8)",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        <span style={{ color: "var(--os-accent-light, #22d3ee)" }}>🪸 OpenSpawn</span>
        <span style={{ opacity: 0.4 }}>›</span>
        <span>Docs</span>
        <span style={{ opacity: 0.4 }}>›</span>
        <span style={{ color: "var(--os-text-primary, #f1f5f9)" }}>Getting Started</span>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 64, alignItems: "flex-start" }}>
        {/* Left: heading + description */}
        <div style={{ flex: "0 0 460px" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(16,185,129,0.10)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 9999,
              padding: "4px 14px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#34d399",
              marginBottom: 20,
            }}
          >
            Tutorial · 10 minutes
          </div>

          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              lineHeight: 1.1,
              margin: "0 0 20px",
              color: "var(--os-text-primary, #f1f5f9)",
            }}
          >
            Getting Started
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              with OpenSpawn
            </span>
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "var(--os-text-secondary, #94a3b8)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            In ~10 minutes: a local org of AI agents, coordinated by a markdown file, visible in a
            real-time dashboard.
          </p>

          {/* Prereqs */}
          <div
            style={{
              marginTop: 28,
              padding: "12px 16px",
              background: "rgba(6,182,212,0.06)",
              border: "1px solid rgba(6,182,212,0.15)",
              borderRadius: 10,
              fontSize: 14,
              color: "var(--os-accent-light, #22d3ee)",
            }}
          >
            <strong>Requires:</strong> Node.js 18+{" "}
            <span style={{ color: "var(--os-text-secondary, #94a3b8)" }}>
              · Ollama optional (free local models)
            </span>
          </div>
        </div>

        {/* Right: step list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.map((step, i) => (
            <div
              key={step.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                background: i === 0 ? "rgba(6,182,212,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${i === 0 ? "rgba(6,182,212,0.20)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 12,
              }}
            >
              {/* Step number */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: i === 0 ? "rgba(6,182,212,0.20)" : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  color: i === 0 ? "#22d3ee" : "var(--os-text-secondary, #94a3b8)",
                  flexShrink: 0,
                }}
              >
                {step.n}
              </div>
              {/* Label + cmd */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color:
                      i === 0 ? "var(--os-text-primary, #f1f5f9)" : "var(--os-text-body, #cbd5e1)",
                    marginBottom: 3,
                  }}
                >
                  {step.label}
                </div>
                <code
                  style={{
                    fontSize: 13,
                    fontFamily: "var(--os-font-mono, monospace)",
                    color: i === 0 ? "#22d3ee" : "var(--os-text-secondary, #94a3b8)",
                  }}
                >
                  {step.cmd}
                </code>
              </div>
              {/* Checkmark for subsequent steps (greyed) */}
              <span style={{ fontSize: 18, opacity: i === 0 ? 1 : 0.3 }}>
                {i === 0 ? "→" : "✓"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
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
