/**
 * HeroBikiniBottom — Full-page hero + landing page sections.
 * This replaces intro.tsx entirely with a BikiniBottom-branded experience.
 *
 * Sections:
 *   1. Hero (full viewport) — animated, yellow headline, big CTA
 *   2. The Story (movie-poster narrative)
 *   3. Live Ticker feed preview
 *   4. Meet the Crew (CharacterCardGrid)
 *   5. Footer
 */

import { motion } from 'motion/react';
import { ArrowRight, Play, Waves } from 'lucide-react';
import { BubbleField } from './BubbleField';
import { KelpSilhouette } from './KelpSilhouette';
import { CharacterCardGrid } from './CharacterCard';
import { LiveTickerFeed } from './LiveTickerFeed';
import { AGENT_ROSTER, SAMPLE_TICKER_MESSAGES } from './agent-roster';

// ── Character swim parade data ────────────────────────────────────────────────
const SWIM_CHARACTERS = [
  { emoji: '🦀', name: 'Mr. Krabs',  delay: 0,  duration: 28 },
  { emoji: '🧽', name: 'SpongeBob', delay: 3,  duration: 22 },
  { emoji: '🐙', name: 'Squidward', delay: 7,  duration: 30 },
  { emoji: '🐿️', name: 'Sandy',     delay: 11, duration: 25 },
  { emoji: '⭐', name: 'Patrick',   delay: 15, duration: 35 },
  { emoji: '🦠', name: 'Plankton',  delay: 2,  duration: 18 },
  { emoji: '🐌', name: 'Gary',      delay: 18, duration: 45 },
  { emoji: '🐳', name: 'Pearl',     delay: 9,  duration: 26 },
  { emoji: '👻', name: 'Dutchman',  delay: 22, duration: 20 },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface HeroBikiniBottomProps {
  onWatchLive: () => void;
  onGitHub?: () => void;
  agentCount?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HeroBikiniBottom({ onWatchLive, onGitHub, agentCount = 22 }: HeroBikiniBottomProps) {
  return (
    <div
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
        {/* Caustic light effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div
            className="absolute w-[600px] h-[400px] -top-20 -left-20 rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(74,174,217,1) 0%, transparent 70%)',
              opacity: 0.06,
              animation: 'bb-caustic 14s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-[500px] h-[300px] top-1/3 right-0 rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(46,204,113,1) 0%, transparent 70%)',
              opacity: 0.04,
              animation: 'bb-caustic 10s 5s ease-in-out infinite',
            }}
          />
        </div>

        {/* Bubble field */}
        <BubbleField count={22} className="z-20" />

        {/* ── Nav ── */}
        <nav className="relative z-30 flex items-center justify-between px-6 py-4 md:px-10 md:py-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="pineapple">🍍</span>
            <span
              className="font-extrabold text-lg tracking-tight"
              style={{ fontFamily: '"Baloo 2", cursive', color: '#F4C542' }}
            >
              BikiniBottom
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onGitHub && (
              <button
                onClick={onGitHub}
                className="text-[#B8E4F7]/60 hover:text-[#B8E4F7] text-sm transition-colors hidden sm:block"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                GitHub
              </button>
            )}
            <motion.button
              onClick={onWatchLive}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm"
              style={{
                background: '#F4C542',
                color: '#062A45',
                fontFamily: '"Baloo 2", cursive',
                boxShadow: '0 0 16px rgba(244,197,66,0.4)',
              }}
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(244,197,66,0.6)' }}
              whileTap={{ scale: 0.97 }}
            >
              <Play className="w-3 h-3" />
              Watch Live
            </motion.button>
          </div>
        </nav>

        {/* ── Hero content ── */}
        <div className="relative z-30 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">

          {/* Subtitle pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold"
            style={{
              background: 'rgba(74,174,217,0.1)',
              borderColor: 'rgba(74,174,217,0.25)',
              color: '#4AAED9',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <Waves className="w-4 h-4" />
            {agentCount} agents · 1 massive order · 0 humans in the loop
          </motion.div>

          {/* H1 — Sandy yellow, NOT cyan */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-black leading-[1.05] tracking-tight mb-6"
            style={{
              fontFamily: '"Baloo 2", cursive',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              color: '#F4C542',
              textShadow: '0 0 60px rgba(244,197,66,0.3)',
              letterSpacing: '-0.02em',
            }}
          >
            Hire the
            <br />
            whole ocean.
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-medium max-w-xl mb-10 leading-relaxed"
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'rgba(184,228,247,0.8)',
            }}
          >
            22 SpongeBob characters running a real business with{' '}
            <span className="font-semibold" style={{ color: '#F4C542' }}>OpenSpawn</span>.
            Watch them argue, delegate, mess up, and somehow deliver 10,000 Krabby Patties.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            {/* PRIMARY CTA — Sandy yellow, big, bouncy */}
            <motion.button
              onClick={onWatchLive}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xl"
              style={{
                background: 'linear-gradient(135deg, #F4C542 0%, #EAB308 100%)',
                color: '#062A45',
                fontFamily: '"Baloo 2", cursive',
                boxShadow: '0 0 24px rgba(244,197,66,0.5), 0 4px 16px rgba(6,42,69,0.3)',
              }}
              whileHover={{
                scale: 1.06,
                y: -3,
                boxShadow: '0 0 40px rgba(244,197,66,0.7), 0 8px 24px rgba(6,42,69,0.4)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Play className="w-5 h-5" />
              Watch the Agents Live
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Secondary */}
            {onGitHub && (
              <motion.button
                onClick={onGitHub}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base border backdrop-blur-sm transition-colors"
                style={{
                  color: '#B8E4F7',
                  fontFamily: 'Nunito, sans-serif',
                  borderColor: 'rgba(74,174,217,0.25)',
                  background: 'rgba(74,174,217,0.08)',
                }}
                whileHover={{ y: -2, borderColor: 'rgba(74,174,217,0.4)' }}
              >
                View on GitHub →
              </motion.button>
            )}
          </motion.div>

          {/* Live ticker preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full max-w-lg"
          >
            <LiveTickerFeed messages={SAMPLE_TICKER_MESSAGES} onJoinWatch={onWatchLive} />
          </motion.div>
        </div>

        {/* ── Character swim parade ── */}
        <div
          className="absolute bottom-28 left-0 right-0 h-16 pointer-events-none overflow-hidden z-20"
          aria-hidden="true"
        >
          {SWIM_CHARACTERS.map(char => (
            <div
              key={char.name}
              className="absolute bottom-2 text-2xl"
              title={char.name}
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(6,42,69,0.5))',
                animation: `bb-swim ${char.duration}s ${char.delay}s linear infinite`,
              }}
            >
              <span
                style={{
                  display: 'block',
                  animation: `bb-bob ${1.5 + char.delay * 0.1}s ease-in-out infinite`,
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
          SECTION 2: THE STORY
          ================================================================ */}
      <section
        className="relative py-20 px-6 overflow-hidden"
        style={{ background: '#062A45' }}
      >
        <BubbleField count={8} className="opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-sm font-bold uppercase tracking-widest mb-4"
              style={{ color: '#4AAED9', fontFamily: 'Nunito, sans-serif' }}
            >
              🎬 THE STORY SO FAR 🎬
            </p>
            <h2
              className="font-black mb-6 leading-tight"
              style={{
                fontFamily: '"Baloo 2", cursive',
                fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                color: '#E8F8FF',
              }}
            >
              One order. 10,000 Krabby Patties.
            </h2>
            <p
              className="text-lg leading-relaxed max-w-2xl mx-auto mb-12"
              style={{ color: 'rgba(184,228,247,0.7)', fontFamily: 'Nunito, sans-serif' }}
            >
              Plankton walks in and orders 10,000 Krabby Patties. Mr. Krabs sees dollar signs.
              SpongeBob cooks faster than Squidward can deliver. Sandy optimizes everything.
              Patrick helps… mostly. 22 agents, 5 departments, 1 <code
                className="px-1.5 py-0.5 rounded text-sm"
                style={{ color: '#F4C542', background: 'rgba(244,197,66,0.1)' }}
              >ORG.md</code>.
            </p>

            {/* Act cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                { act: 'Act I', title: 'The Order', desc: 'Plankton places the most ambitious order in Bikini Bottom history. Mr. Krabs says yes immediately.', icon: '🦠' },
                { act: 'Act II', title: 'Kitchen Heats Up', desc: 'SpongeBob enters overdrive. Squidward hits his limit. Sandy spins up 3 more Fred clones.', icon: '🔥' },
                { act: 'Act III', title: 'Delivery Crisis', desc: 'The queue hits 200+. Mr. Krabs delegates hard. Flying Dutchman audits the books. Patties delivered.', icon: '📦' },
              ].map(a => (
                <div
                  key={a.act}
                  className="rounded-2xl p-5 border"
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
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          SECTION 3: MEET THE CREW
          ================================================================ */}
      <section
        className="relative py-20 px-6 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, #062A45 0%, #030E1A 100%)`,
        }}
      >
        <BubbleField count={10} className="opacity-40" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p
              className="text-sm font-bold uppercase tracking-widest mb-4"
              style={{ color: '#4AAED9', fontFamily: 'Nunito, sans-serif' }}
            >
              👥 MEET THE CREW
            </p>
            <h2
              className="font-black mb-4"
              style={{
                fontFamily: '"Baloo 2", cursive',
                fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                color: '#E8F8FF',
              }}
            >
              22 fish in a frenzy.
            </h2>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: 'rgba(184,228,247,0.6)', fontFamily: 'Nunito, sans-serif' }}
            >
              Each agent is a real SpongeBob character with a job title, a team, and way too much to do.
            </p>
          </motion.div>

          <CharacterCardGrid agents={AGENT_ROSTER} maxVisible={6} />

          {/* CTA to watch live */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mt-12"
          >
            <motion.button
              onClick={onWatchLive}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xl"
              style={{
                background: 'linear-gradient(135deg, #F4C542 0%, #EAB308 100%)',
                color: '#062A45',
                fontFamily: '"Baloo 2", cursive',
                boxShadow: '0 0 24px rgba(244,197,66,0.4)',
              }}
              whileHover={{ scale: 1.05, y: -2, boxShadow: '0 0 40px rgba(244,197,66,0.6)' }}
              whileTap={{ scale: 0.97 }}
            >
              <Play className="w-5 h-5" />
              Watch Them Work
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
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
