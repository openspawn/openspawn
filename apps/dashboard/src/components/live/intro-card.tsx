/**
 * IntroCard — Full-screen intro overlay that communicates OpenSpawn's value prop.
 * CSS animations only. prefers-reduced-motion: respected via media query.
 */

import { Play } from 'lucide-react';

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
        background: 'rgba(3,14,26,0.97)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <style>{INTRO_STYLES}</style>

      <div className="flex flex-col items-center text-center max-w-2xl w-full">
        {/* Hero headline */}
        <h1
          className="intro-hero font-black mb-4 leading-tight"
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontSize: 'clamp(1.75rem, 5vw, 3rem)',
            color: '#F4C542',
            textShadow: '0 0 40px rgba(244,197,66,0.3)',
          }}
        >
          Watch 42 agents run a restaurant.
          <br />
          No humans. One command.
        </h1>

        {/* Divider line */}
        <div
          className="intro-line h-px mb-6"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(74,174,217,0.5), transparent)' }}
        />

        {/* Subtext */}
        <p
          className="intro-sub text-lg mb-8 max-w-md"
          style={{
            color: 'rgba(184,228,247,0.7)',
            fontFamily: 'Nunito, sans-serif',
            lineHeight: 1.6,
          }}
        >
          Built with{' '}
          <span style={{ color: '#4AAED9', fontWeight: 700 }}>OpenSpawn</span>
          {' '}— the platform agents use when sub-agents aren't enough.
        </p>

        {/* Comparison card */}
        <div
          className="intro-compare w-full max-w-lg rounded-2xl p-5 mb-8"
          style={{
            background: 'rgba(6,42,69,0.6)',
            border: '1px solid rgba(74,174,217,0.2)',
          }}
        >
          <div className="grid grid-cols-2 gap-4 text-left">
            {/* Sub-agents column */}
            <div>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'rgba(184,228,247,0.4)', fontFamily: 'Nunito, sans-serif' }}
              >
                Sub-agents
              </div>
              <ul className="space-y-2 text-sm" style={{ color: 'rgba(184,228,247,0.45)', fontFamily: 'Nunito, sans-serif' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#FF4757' }}>✗</span> No persistence
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#FF4757' }}>✗</span> No hierarchy
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#FF4757' }}>✗</span> No peer communication
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#FF4757' }}>✗</span> No org structure
                </li>
              </ul>
            </div>

            {/* OpenSpawn column */}
            <div>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: '#4AAED9', fontFamily: 'Nunito, sans-serif' }}
              >
                🪸 OpenSpawn
              </div>
              <ul className="space-y-2 text-sm" style={{ color: 'rgba(184,228,247,0.7)', fontFamily: 'Nunito, sans-serif' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#4AE88A' }}>✓</span> Persistent agents
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#4AE88A' }}>✓</span> Org hierarchy
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#4AE88A' }}>✓</span> Agent-to-agent comms
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#4AE88A' }}>✓</span> Escalation & delegation
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* OpenSpawn badge */}
        <div
          className="intro-badge flex items-center gap-2 mb-8 px-4 py-2 rounded-xl"
          style={{
            background: 'rgba(74,174,217,0.08)',
            border: '1px solid rgba(74,174,217,0.2)',
          }}
        >
          <span>🪸</span>
          <span className="text-xs" style={{ color: 'rgba(184,228,247,0.5)', fontFamily: 'Nunito, sans-serif' }}>
            42 agents · 5 departments · 0 humans · Powered by OpenSpawn
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="intro-btn flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg cursor-pointer border-none"
          style={{
            background: 'linear-gradient(135deg, #4AAED9 0%, #1A7DB5 100%)',
            color: '#fff',
            fontFamily: '"Baloo 2", cursive',
            letterSpacing: '0.02em',
          }}
        >
          <Play className="w-5 h-5" />
          Watch the Demo →
        </button>

        <p
          className="text-xs mt-4"
          style={{ color: 'rgba(184,228,247,0.2)', fontFamily: 'Nunito, sans-serif' }}
        >
          ~75 seconds · Defined in one markdown file
        </p>
      </div>
    </div>
  );
}
