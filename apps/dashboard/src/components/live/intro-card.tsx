/**
 * IntroCard — Full-screen intro overlay that communicates OpenSpawn's value prop.
 * CSS animations only. prefers-reduced-motion: respected via media query.
 */

import { Play } from "lucide-react";

interface IntroCardProps {
  onStart: () => void;
}

const INTRO_STYLES = `
  @keyframes intro-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes intro-hero-in {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes intro-sub-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes intro-compare-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes intro-btn-in {
    0%   { opacity: 0; transform: scale(0.85); }
    60%  { transform: scale(1.04); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes intro-cta-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(74,174,217,0.4), 0 0 40px rgba(74,174,217,0.15); }
    50%       { box-shadow: 0 0 32px rgba(74,174,217,0.6), 0 0 60px rgba(74,174,217,0.25); }
  }
  @keyframes intro-line-expand {
    from { width: 0; opacity: 0; }
    to   { width: 120px; opacity: 1; }
  }
  @keyframes intro-badge-in {
    from { opacity: 0; transform: scale(0.9); }
    to   { opacity: 1; transform: scale(1); }
  }

  .intro-overlay   { animation: intro-overlay-in  0.5s ease forwards; }
  .intro-hero      { animation: intro-hero-in     0.6s 0.2s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
  .intro-sub       { animation: intro-sub-in      0.5s 0.5s ease forwards; opacity: 0; }
  .intro-compare   { animation: intro-compare-in  0.5s 0.7s ease forwards; opacity: 0; }
  .intro-btn       {
    animation:
      intro-btn-in   0.5s 1.0s cubic-bezier(0.34,1.56,0.64,1) forwards,
      intro-cta-glow 2.5s 1.6s ease-in-out infinite;
    opacity: 0;
  }
  .intro-btn:hover {
    animation-play-state: paused;
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 0 40px rgba(74,174,217,0.7), 0 0 80px rgba(74,174,217,0.3) !important;
  }
  .intro-btn:active {
    transform: scale(0.97);
  }
  .intro-line { animation: intro-line-expand 0.6s 0.4s ease forwards; width: 0; opacity: 0; }
  .intro-badge { animation: intro-badge-in 0.5s 0.9s ease forwards; opacity: 0; }

  @media (prefers-reduced-motion: reduce) {
    .intro-overlay, .intro-hero, .intro-sub, .intro-compare,
    .intro-btn, .intro-line, .intro-badge {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

export function IntroCard({ onStart }: IntroCardProps) {
  return (
    <div
      className="intro-overlay fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: "rgba(3,14,26,0.97)",
        backdropFilter: "blur(12px)",
      }}
    >
      <style>{INTRO_STYLES}</style>

      <div className="flex flex-col items-center text-center max-w-2xl w-full">
        {/* Mr. Krabs intro */}
        <div className="intro-hero flex items-center gap-3 mb-6">
          <span className="text-4xl">🦀</span>
          <div className="text-left">
            <div
              className="font-black text-lg"
              style={{ color: "#F4C542", fontFamily: '"Baloo 2", cursive' }}
            >
              Mr. Krabs
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(184,228,247,0.5)", fontFamily: "Nunito, sans-serif" }}
            >
              CEO · The Krusty Krab
            </div>
          </div>
        </div>

        {/* The command — this is the origin story */}
        <div
          className="intro-sub w-full max-w-lg rounded-xl mb-6 overflow-hidden"
          style={{
            background: "#0d1117",
            border: "1px solid rgba(74,174,217,0.3)",
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
              background: "rgba(74,174,217,0.08)",
              borderBottom: "1px solid rgba(74,174,217,0.15)",
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
            <span
              className="ml-2 text-xs"
              style={{ color: "rgba(184,228,247,0.3)", fontFamily: "monospace" }}
            >
              terminal
            </span>
          </div>
          <div
            className="px-4 py-4"
            style={{ fontFamily: '"Fira Code", "JetBrains Mono", monospace', fontSize: "13px" }}
          >
            <div style={{ color: "rgba(184,228,247,0.4)" }}>
              <span style={{ color: "#4AE88A" }}>mr-krabs</span>
              <span style={{ color: "rgba(184,228,247,0.3)" }}> ~ $ </span>
            </div>
            <div className="mt-1" style={{ color: "#79c0ff" }}>
              npx openspawn start{" "}
              <span style={{ color: "#F4C542" }}>
                "Run the Krusty Krab — 10,000 patties, 5 departments, zero humans"
              </span>
            </div>
            <div className="mt-3" style={{ color: "rgba(184,228,247,0.5)" }}>
              <div>🐙 OpenSpawn v0.1.0</div>
              <div className="mt-1">
                <span style={{ color: "#4AE88A" }}>✓</span> Parsed ORG.md — 22 agents, 5 departments
              </div>
              <div>
                <span style={{ color: "#4AE88A" }}>✓</span> Created agent workspaces
              </div>
              <div>
                <span style={{ color: "#4AE88A" }}>✓</span> Gateway patched — all agents online
              </div>
              <div className="mt-1" style={{ color: "#4AAED9" }}>
                Your org is running. Dashboard: http://localhost:3333
              </div>
            </div>
          </div>
        </div>

        {/* Hero headline */}
        <h1
          className="intro-compare font-black mb-3 leading-tight"
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            color: "#F4C542",
            textShadow: "0 0 40px rgba(244,197,66,0.3)",
          }}
        >
          One command. 22 agents. Zero humans.
        </h1>

        <p
          className="intro-compare text-sm mb-6 max-w-md"
          style={{
            color: "rgba(184,228,247,0.6)",
            fontFamily: "Nunito, sans-serif",
            lineHeight: 1.6,
          }}
        >
          Mr. Krabs used <span style={{ color: "#4AAED9", fontWeight: 700 }}>OpenSpawn</span> to
          spin up an entire restaurant operation — kitchen, delivery, finance — from a single ORG.md
          file. Watch what happens next.
        </p>

        {/* Divider line */}
        <div
          className="intro-line h-px mb-6"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(74,174,217,0.5), transparent)",
          }}
        />

        {/* Quick comparison — compact */}
        <div
          className="intro-badge flex items-center gap-4 mb-8 text-xs"
          style={{ color: "rgba(184,228,247,0.5)", fontFamily: "Nunito, sans-serif" }}
        >
          <span>
            <span style={{ color: "#FF4757" }}>✗</span> Sub-agents: no persistence, no hierarchy, no
            peer comms
          </span>
          <span style={{ color: "rgba(74,174,217,0.3)" }}>|</span>
          <span>
            <span style={{ color: "#4AE88A" }}>✓</span> OpenSpawn: persistent org, hierarchy,
            escalation, budgets
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="intro-btn flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg cursor-pointer border-none"
          style={{
            background: "linear-gradient(135deg, #4AAED9 0%, #1A7DB5 100%)",
            color: "#fff",
            fontFamily: '"Baloo 2", cursive',
            letterSpacing: "0.02em",
          }}
        >
          <Play className="w-5 h-5" />
          Watch the Demo →
        </button>

        <p
          className="text-xs mt-4"
          style={{ color: "rgba(184,228,247,0.2)", fontFamily: "Nunito, sans-serif" }}
        >
          ~75 seconds · 22 agents scale to 42 · Defined in one markdown file
        </p>
      </div>
    </div>
  );
}
