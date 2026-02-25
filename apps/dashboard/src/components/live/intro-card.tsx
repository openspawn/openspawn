/**
 * IntroCard — Full-screen intro overlay before the live dashboard.
 * POLISH PASS: Replaced motion/react with CSS-only animations.
 * CSS animations only. prefers-reduced-motion: respected via media query.
 */

import { Play } from 'lucide-react';

interface IntroCardProps {
  onStart: () => void;
}

// CSS animations injected once
const INTRO_STYLES = `
  @keyframes intro-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes intro-terminal-in {
    from { opacity: 0; transform: translateX(-32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes intro-copy-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes intro-burger-bounce {
    0%   { transform: scale(0.5) rotate(-12deg); opacity: 0; }
    60%  { transform: scale(1.12) rotate(3deg); opacity: 1; }
    80%  { transform: scale(0.96) rotate(-1deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes intro-title-in {
    from { opacity: 0; transform: translateY(10px); letter-spacing: 0.1em; }
    to   { opacity: 1; transform: translateY(0); letter-spacing: -0.01em; }
  }
  @keyframes intro-btn-in {
    0%   { opacity: 0; transform: scale(0.85); }
    60%  { transform: scale(1.04); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes intro-cta-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(244,197,66,0.5), 0 0 40px rgba(244,197,66,0.2); }
    50%       { box-shadow: 0 0 32px rgba(244,197,66,0.75), 0 0 60px rgba(244,197,66,0.35); }
  }

  .intro-overlay   { animation: intro-overlay-in  0.5s ease forwards; }
  .intro-terminal  { animation: intro-terminal-in 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
  .intro-copy      { animation: intro-copy-in     0.5s 0.4s ease forwards; opacity: 0; }
  .intro-burger    { animation: intro-burger-bounce 0.6s 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; opacity: 0; }
  .intro-title     { animation: intro-title-in    0.5s 0.65s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
  .intro-btn       {
    animation:
      intro-btn-in   0.5s 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards,
      intro-cta-glow 2.5s 1.4s ease-in-out infinite;
    opacity: 0;
  }
  .intro-btn:hover {
    animation-play-state: paused;
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 0 40px rgba(244,197,66,0.8), 0 0 80px rgba(244,197,66,0.4) !important;
  }
  .intro-btn:active {
    transform: scale(0.97);
  }

  @media (prefers-reduced-motion: reduce) {
    .intro-overlay, .intro-terminal, .intro-copy, .intro-burger,
    .intro-title, .intro-btn {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

const ORG_LINES = [
  '# 🍍 The Krusty Krab',
  '',
  '## Structure',
  '',
  '### 🦀 Mr. Krabs — Owner',
  'Makes the tough calls. Watches every credit.',
  '- **Level:** 10',
  '- **Domain:** Executive',
  '',
  '#### 🧽 SpongeBob — Head Fry Cook',
  'Runs the grill. Can sessions_spawn sous chefs.',
  '- **Level:** 9',
  '- **Domain:** Kitchen',
  '- **Reports to:** Mr. Krabs',
  '',
  '#### 🐙 Squidward — Head Cashier',
  'Delivers every order. The bottleneck.',
  '- **Level:** 9',
  '- **Domain:** Floor',
  '- **Reports to:** Mr. Krabs',
  '',
  '#### 🎩 Squilliam — Bookkeeper',
  'Tracks every credit.',
  '- **Level:** 9',
  '- **Domain:** Finance',
  '- **Reports to:** Mr. Krabs',
];

function renderLine(line: string) {
  if (line.startsWith('#### '))
    return <span style={{ color: '#F4C542', fontWeight: 'bold' }}>{line.slice(5)}</span>;
  if (line.startsWith('### '))
    return <span style={{ color: '#F4C542', fontWeight: 'bold', fontSize: '15px' }}>{line.slice(4)}</span>;
  if (line.startsWith('## '))
    return <span style={{ color: '#4AAED9', fontWeight: 'bold' }}>{line.slice(3)}</span>;
  if (line.startsWith('# '))
    return <span style={{ color: '#4AAED9', fontWeight: 'bold', fontSize: '1.125rem' }}>{line.slice(2)}</span>;

  const metaMatch = line.match(/^- \*\*(.+?):\*\* (.+)$/);
  if (metaMatch) {
    return (
      <span>
        <span style={{ color: '#4AAED9' }}>- </span>
        <span style={{ color: '#B8E4F7', fontWeight: '600' }}>{metaMatch[1]}:</span>
        <span style={{ color: 'rgba(184,228,247,0.6)' }}> {metaMatch[2]}</span>
      </span>
    );
  }

  if (line.includes('sessions_spawn')) {
    const parts = line.split('sessions_spawn');
    return (
      <span style={{ color: 'rgba(184,228,247,0.5)' }}>
        {parts[0]}
        <code
          className="px-1.5 py-0.5 rounded text-[11px]"
          style={{ background: 'rgba(244,197,66,0.1)', color: '#F4C542' }}
        >
          sessions_spawn
        </code>
        {parts[1]}
      </span>
    );
  }

  if (line === '') return <span>&nbsp;</span>;
  return <span style={{ color: 'rgba(184,228,247,0.45)' }}>{line}</span>;
}

export function IntroCard({ onStart }: IntroCardProps) {
  return (
    <div
      className="intro-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(3,14,26,0.96)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <style>{INTRO_STYLES}</style>

      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-5xl w-full">
        {/* Left: ORG.md terminal */}
        <div className="intro-terminal w-full md:w-[55%] shrink-0">
          <div
            className="rounded-2xl max-h-[40vh] md:max-h-none overflow-y-auto scrollbar-none"
            style={{
              background: '#0B3D60',
              border: '1px solid rgba(74,174,217,0.2)',
              boxShadow: '0 0 40px rgba(74,174,217,0.08)',
            }}
          >
            {/* Terminal chrome */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: '1px solid rgba(74,174,217,0.1)' }}
            >
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF4757' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F4C542' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4AE88A' }} />
              </div>
              <span
                className="ml-2"
                style={{ color: 'rgba(184,228,247,0.4)', fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace' }}
              >
                org.md
              </span>
            </div>
            {/* Content */}
            <div
              className="p-4 text-[13px] leading-relaxed"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {ORG_LINES.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span
                    className="select-none w-5 text-right shrink-0 text-[11px] leading-relaxed"
                    style={{ color: 'rgba(74,174,217,0.2)' }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">{renderLine(line)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Intro copy */}
        <div className="intro-copy flex flex-col items-center md:items-start text-center md:text-left">
          <div className="intro-burger text-7xl mb-4">🍔</div>

          <div
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: 'rgba(184,228,247,0.4)', fontFamily: 'Nunito, sans-serif' }}
          >
            Operation:
          </div>
          <h1
            className="intro-title font-black mb-6"
            style={{
              fontFamily: '"Baloo 2", cursive',
              fontSize: '1.875rem',
              color: '#F4C542',
              textShadow: '0 0 30px rgba(244,197,66,0.3)',
            }}
          >
            10,000 KRABBY PATTIES
          </h1>
          <p
            className="text-lg mb-1"
            style={{ color: 'rgba(184,228,247,0.6)', fontFamily: 'Nunito, sans-serif' }}
          >
            22 agents. One massive order.
          </p>
          <p
            className="text-lg mb-8"
            style={{ color: 'rgba(184,228,247,0.6)', fontFamily: 'Nunito, sans-serif' }}
          >
            Watch them coordinate — or collapse.
          </p>

          <button
            onClick={onStart}
            className="intro-btn flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-lg cursor-pointer border-none"
            style={{
              background: 'linear-gradient(135deg, #F4C542 0%, #EAB308 100%)',
              color: '#062A45',
              fontFamily: '"Baloo 2", cursive',
            }}
          >
            <Play className="w-5 h-5" />
            Watch the Story →
          </button>

          <p
            className="text-xs mt-3"
            style={{ color: 'rgba(184,228,247,0.25)', fontFamily: 'Nunito, sans-serif' }}
          >
            Defined in one markdown file.
          </p>
        </div>
      </div>
    </div>
  );
}
