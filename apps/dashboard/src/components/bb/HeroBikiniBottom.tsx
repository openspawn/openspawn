/**
 * HeroBikiniBottom — Full-page hero + landing page sections.
 * POLISH PASS: scroll-reveal, text animation, glow CTA, multi-layer caustics,
 * organic bubble field, natural kelp, character swim parade.
 *
 * All animations: CSS-only (no motion/react).
 * prefers-reduced-motion: respected via bb-tokens.css media query.
 */

import { useEffect, useRef } from 'react';
import { ArrowRight, Play, Waves } from 'lucide-react';
import { BubbleField } from './BubbleField';
import { KelpSilhouette } from './KelpSilhouette';
import { CharacterCardGrid } from './CharacterCard';
import { LiveTickerFeed } from './LiveTickerFeed';
import { AGENT_ROSTER, SAMPLE_TICKER_MESSAGES } from './agent-roster';

// ── Character swim parade data ────────────────────────────────────────────────
const SWIM_CHARACTERS = [
  { emoji: '🦀', name: 'Mr. Krabs',  delay: 0,   duration: 28, vOffset: 0,  bobDuration: 1.8  },
  { emoji: '🧽', name: 'SpongeBob', delay: 5,   duration: 22, vOffset: -8, bobDuration: 1.2  },
  { emoji: '🐙', name: 'Squidward', delay: 10,  duration: 32, vOffset: 4,  bobDuration: 2.0  },
  { emoji: '🐿️', name: 'Sandy',     delay: 14,  duration: 26, vOffset: -4, bobDuration: 1.5  },
  { emoji: '⭐', name: 'Patrick',   delay: 18,  duration: 38, vOffset: 8,  bobDuration: 2.5  },
  { emoji: '🦠', name: 'Plankton',  delay: 2,   duration: 18, vOffset: -12,bobDuration: 0.9  },
  { emoji: '🐌', name: 'Gary',      delay: 22,  duration: 48, vOffset: 6,  bobDuration: 3.0  },
  { emoji: '🐳', name: 'Pearl',     delay: 8,   duration: 27, vOffset: -2, bobDuration: 2.2  },
  { emoji: '👻', name: 'Dutchman',  delay: 25,  duration: 21, vOffset: -16,bobDuration: 1.4  },
  { emoji: '🤖', name: 'Karen',     delay: 16,  duration: 24, vOffset: 10, bobDuration: 1.6  },
];

// ── Scroll reveal hook ────────────────────────────────────────────────────────
function useScrollReveal(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = container.querySelectorAll('.bb-reveal');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [containerRef]);
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface HeroBikiniBottomProps {
  onWatchLive: () => void;
  onGitHub?: () => void;
  agentCount?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function HeroBikiniBottom({ onWatchLive, onGitHub, agentCount = 22 }: HeroBikiniBottomProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollReveal(pageRef as React.RefObject<HTMLElement>);

  return (
    <div
      ref={pageRef}
      className="bb-theme relative w-full overflow-x-hidden"
      style={{ fontFamily: 'Nunito, DM Sans, system-ui, sans-serif' }}
    >
      {/* ================================================================
          SECTION 1: HERO (full viewport)
          ================================================================ */}
      <section
        className="relative min-h-screen w-full overflow-hidden flex flex-col"
        style={{
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(11,94,138,0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(26,125,181,0.4) 0%, transparent 50%),
            linear-gradient(180deg, #062A45 0%, #030E1A 100%)
          `,
        }}
      >
        {/* ── Multi-layer caustic light effects ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {/* Layer 1 — blue, slow sweep */}
          <div
            className="absolute rounded-full"
            style={{
              width: '70vw', height: '50vh',
              top: '-10vh', left: '-10vw',
              background: 'radial-gradient(ellipse, rgba(74,174,217,1) 0%, transparent 70%)',
              opacity: 0.06,
              animation: 'bb-caustic 16s ease-in-out infinite',
            }}
          />
          {/* Layer 2 — green, mid-speed */}
          <div
            className="absolute rounded-full"
            style={{
              width: '55vw', height: '40vh',
              top: '30%', right: '-5vw',
              background: 'radial-gradient(ellipse, rgba(46,204,113,1) 0%, transparent 70%)',
              opacity: 0.04,
              animation: 'bb-caustic-2 11s 4s ease-in-out infinite',
            }}
          />
          {/* Layer 3 — sandy highlight, center-bottom */}
          <div
            className="absolute rounded-full"
            style={{
              width: '40vw', height: '30vh',
              bottom: '10%', left: '30%',
              background: 'radial-gradient(ellipse, rgba(244,197,66,1) 0%, transparent 70%)',
              opacity: 0.03,
              animation: 'bb-caustic-3 19s 8s ease-in-out infinite',
            }}
          />
          {/* Layer 4 — deep blue drift, top-right */}
          <div
            className="absolute rounded-full"
            style={{
              width: '45vw', height: '35vh',
              top: '15%', right: '20%',
              background: 'radial-gradient(ellipse, rgba(26,125,181,1) 0%, transparent 70%)',
              opacity: 0.05,
              animation: 'bb-caustic-2 14s 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Organic bubble field */}
        <BubbleField count={28} className="z-20" />

        {/* ── Nav ── */}
        <nav className="relative z-30 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
          <div className="flex items-center gap-2" style={{ animation: 'bb-fade-up 0.6s 0.1s ease forwards', opacity: 0 }}>
            <span className="text-2xl" role="img" aria-label="pineapple">🍍</span>
            <span
              className="font-extrabold text-lg tracking-tight"
              style={{ fontFamily: '"Baloo 2", cursive', color: '#F4C542' }}
            >
              BikiniBottom
            </span>
          </div>
          <div className="flex items-center gap-3" style={{ animation: 'bb-fade-up 0.6s 0.2s ease forwards', opacity: 0 }}>
            {onGitHub && (
              <button
                onClick={onGitHub}
                className="text-[#B8E4F7]/60 hover:text-[#B8E4F7] text-sm transition-colors hidden sm:block"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                GitHub
              </button>
            )}
            <button
              onClick={onWatchLive}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-[1.04] active:scale-[0.97]"
              style={{
                background: '#F4C542',
                color: '#062A45',
                fontFamily: '"Baloo 2", cursive',
                boxShadow: '0 0 16px rgba(244,197,66,0.4)',
              }}
            >
              <Play className="w-3 h-3" />
              Watch Live
            </button>
          </div>
        </nav>

        {/* ── Hero content ── */}
        <div className="relative z-30 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">

          {/* Subtitle pill — shimmer */}
          <div
            className="bb-pill-shimmer bb-fade-up-1 mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold"
            style={{
              borderColor: 'rgba(74,174,217,0.25)',
              color: '#4AAED9',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <Waves className="w-4 h-4" />
            {agentCount} agents · 1 massive order · 0 humans in the loop
          </div>

          {/* H1 — word-by-word reveal animation */}
          <h1
            className="font-black leading-[1.05] tracking-tight mb-6"
            style={{
              fontFamily: '"Baloo 2", cursive',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              color: '#F4C542',
              textShadow: '0 0 60px rgba(244,197,66,0.35), 0 0 120px rgba(244,197,66,0.15)',
              letterSpacing: '-0.02em',
            }}
          >
            <span className="bb-hero-word">Hire</span>{' '}
            <span className="bb-hero-word">the</span>
            <br />
            <span className="bb-hero-word">whole</span>{' '}
            <span className="bb-hero-word">ocean.</span>
          </h1>

          {/* Subhead — fade up */}
          <p
            className="bb-fade-up-2 font-medium max-w-xl mb-10 leading-relaxed"
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'rgba(184,228,247,0.8)',
            }}
          >
            22 SpongeBob characters running a real business with{' '}
            <span className="font-semibold" style={{ color: '#F4C542' }}>OpenSpawn</span>.
            Watch them argue, delegate, mess up, and somehow deliver 10,000 Krabby Patties.
          </p>

          {/* CTA buttons — fade up with glow pulse on primary */}
          <div className="bb-fade-up-3 flex flex-col sm:flex-row items-center gap-4 mb-16">
            {/* PRIMARY CTA — Sandy yellow, glow pulse, magnetic hover */}
            <button
              onClick={onWatchLive}
              className="bb-cta-pulse group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xl transition-transform hover:scale-[1.06] hover:-translate-y-1 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #F4C542 0%, #EAB308 100%)',
                color: '#062A45',
                fontFamily: '"Baloo 2", cursive',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Play className="w-5 h-5" />
              Watch the Agents Live
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary */}
            {onGitHub && (
              <button
                onClick={onGitHub}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base border backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#4AAED9]/50 hover:bg-[#4AAED9]/15"
                style={{
                  color: '#B8E4F7',
                  fontFamily: 'Nunito, sans-serif',
                  borderColor: 'rgba(74,174,217,0.25)',
                  background: 'rgba(74,174,217,0.08)',
                }}
              >
                View on GitHub →
              </button>
            )}
          </div>

          {/* Live ticker preview */}
          <div className="bb-fade-up-4 w-full max-w-lg">
            <LiveTickerFeed messages={SAMPLE_TICKER_MESSAGES} onJoinWatch={onWatchLive} />
          </div>
        </div>

        {/* ── Character swim parade — varied speeds, bob amplitudes, z-offsets ── */}
        <div
          className="absolute bottom-28 left-0 right-0 h-20 pointer-events-none overflow-hidden z-20"
          aria-hidden="true"
        >
          {SWIM_CHARACTERS.map(char => (
            <div
              key={char.name}
              className="absolute text-2xl"
              title={char.name}
              style={{
                bottom: `${8 + Math.abs(char.vOffset)}px`,
                filter: 'drop-shadow(0 2px 6px rgba(6,42,69,0.6))',
                animation: `bb-swim ${char.duration}s ${char.delay}s linear infinite`,
              }}
            >
              {/* Per-character bob with unique duration */}
              <span
                style={{
                  display: 'block',
                  animation: `bb-swim-bob ${char.bobDuration}s ease-in-out infinite`,
                  animationDelay: `${char.delay * 0.3}s`,
                }}
              >
                {char.emoji}
              </span>
            </div>
          ))}
        </div>

        {/* Kelp silhouettes */}
        <KelpSilhouette className="z-10" />

        {/* "Powered by OpenSpawn" — subtle */}
        <div className="relative z-30 py-3 text-center">
          <p style={{ color: 'rgba(184,228,247,0.2)', fontSize: '0.75rem', fontFamily: 'Nunito, sans-serif' }}>
            Powered by{' '}
            <a
              href="https://openspawn.dev"
              className="hover:opacity-60 transition-opacity underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenSpawn
            </a>
            {' '}— the open-source multi-agent platform
          </p>
        </div>
      </section>

      {/* ================================================================
          SECTION 2: THE STORY — scroll-reveal cards
          ================================================================ */}
      <section
        className="relative py-20 px-6 overflow-hidden"
        style={{ background: '#062A45' }}
      >
        <BubbleField count={8} className="opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p
            className="bb-reveal text-sm font-bold uppercase tracking-widest mb-4"
            style={{ color: '#4AAED9', fontFamily: 'Nunito, sans-serif' }}
          >
            🎬 THE STORY SO FAR 🎬
          </p>
          <h2
            className="bb-reveal bb-reveal-delay-1 font-black mb-6 leading-tight"
            style={{
              fontFamily: '"Baloo 2", cursive',
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              color: '#E8F8FF',
            }}
          >
            One order. 10,000 Krabby Patties.
          </h2>
          <p
            className="bb-reveal bb-reveal-delay-2 text-lg leading-relaxed max-w-2xl mx-auto mb-12"
            style={{ color: 'rgba(184,228,247,0.7)', fontFamily: 'Nunito, sans-serif' }}
          >
            Plankton walks in and orders 10,000 Krabby Patties. Mr. Krabs sees dollar signs.
            SpongeBob cooks faster than Squidward can deliver. Sandy optimizes everything.
            Patrick helps… mostly. 22 agents, 5 departments, 1 <code
              className="px-1.5 py-0.5 rounded text-sm"
              style={{ color: '#F4C542', background: 'rgba(244,197,66,0.1)' }}
            >ORG.md</code>.
          </p>

          {/* Act cards — staggered reveal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { act: 'Act I', title: 'The Order', desc: 'Plankton places the most ambitious order in Bikini Bottom history. Mr. Krabs says yes immediately.', icon: '🦠', delay: 3 },
              { act: 'Act II', title: 'Kitchen Heats Up', desc: 'SpongeBob enters overdrive. Squidward hits his limit. Sandy spins up 3 more Fred clones.', icon: '🔥', delay: 4 },
              { act: 'Act III', title: 'Delivery Crisis', desc: 'The queue hits 200+. Mr. Krabs delegates hard. Flying Dutchman audits the books. Patties delivered.', icon: '📦', delay: 5 },
            ].map(a => (
              <div
                key={a.act}
                className={`bb-reveal bb-reveal-delay-${a.delay} rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 hover:border-[#F4C542]/30 hover:shadow-[0_0_24px_rgba(244,197,66,0.15)]`}
                style={{
                  background: 'rgba(11,61,96,0.5)',
                  borderColor: 'rgba(74,174,217,0.2)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="text-2xl mb-2">{a.icon}</div>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: '#4AAED9', fontFamily: 'Nunito, sans-serif' }}
                >
                  {a.act}
                </div>
                <h3
                  className="font-bold mb-2"
                  style={{ fontFamily: '"Baloo 2", cursive', color: '#F4C542', fontSize: '1.1rem' }}
                >
                  {a.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(184,228,247,0.6)', fontFamily: 'Nunito, sans-serif' }}
                >
                  {a.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 3: MEET THE CREW — scroll-reveal
          ================================================================ */}
      <section
        className="relative py-20 px-6 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, #062A45 0%, #030E1A 100%)`,
        }}
      >
        <BubbleField count={10} className="opacity-40" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="bb-reveal text-sm font-bold uppercase tracking-widest mb-4"
              style={{ color: '#4AAED9', fontFamily: 'Nunito, sans-serif' }}
            >
              👥 MEET THE CREW
            </p>
            <h2
              className="bb-reveal bb-reveal-delay-1 font-black mb-4"
              style={{
                fontFamily: '"Baloo 2", cursive',
                fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                color: '#E8F8FF',
              }}
            >
              22 fish in a frenzy.
            </h2>
            <p
              className="bb-reveal bb-reveal-delay-2 text-lg max-w-xl mx-auto"
              style={{ color: 'rgba(184,228,247,0.6)', fontFamily: 'Nunito, sans-serif' }}
            >
              Each agent is a real SpongeBob character with a job title, a team, and way too much to do.
            </p>
          </div>

          <div className="bb-reveal bb-reveal-delay-3">
            <CharacterCardGrid agents={AGENT_ROSTER} maxVisible={6} />
          </div>

          {/* CTA to watch live */}
          <div className="bb-reveal bb-reveal-delay-4 text-center mt-12">
            <button
              onClick={onWatchLive}
              className="bb-cta-pulse group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xl transition-transform hover:scale-[1.05] hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #F4C542 0%, #EAB308 100%)',
                color: '#062A45',
                fontFamily: '"Baloo 2", cursive',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Play className="w-5 h-5" />
              Watch Them Work
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Kelp at bottom of this section too */}
        <KelpSilhouette className="z-0 opacity-50" />
      </section>

      {/* ================================================================
          SECTION 4: FOOTER
          ================================================================ */}
      <footer
        className="relative py-8 px-6 border-t"
        style={{
          background: '#030E1A',
          borderColor: 'rgba(74,174,217,0.1)',
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍍</span>
            <span
              className="font-extrabold"
              style={{ fontFamily: '"Baloo 2", cursive', color: '#F4C542' }}
            >
              BikiniBottom
            </span>
          </div>
          <div
            className="flex items-center gap-6 text-sm"
            style={{ color: 'rgba(184,228,247,0.4)', fontFamily: 'Nunito, sans-serif' }}
          >
            <a
              href="https://github.com/openspawn/openspawn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#B8E4F7] transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://openspawn.github.io/openspawn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#B8E4F7] transition-colors"
            >
              OpenSpawn Docs
            </a>
          </div>
          <p style={{ color: 'rgba(184,228,247,0.25)', fontSize: '0.75rem', fontFamily: 'Nunito, sans-serif' }}>
            Powered by{' '}
            <a
              href="https://openspawn.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-60 transition-opacity"
            >
              OpenSpawn
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
