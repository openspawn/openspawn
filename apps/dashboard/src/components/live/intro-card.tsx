import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface IntroCardProps {
  onStart: () => void;
}

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
  if (line.startsWith('#### ')) return <span className="text-cyan-400 font-bold">{line.slice(5)}</span>;
  if (line.startsWith('### ')) return <span className="text-cyan-400 font-bold text-[15px]">{line.slice(4)}</span>;
  if (line.startsWith('## ')) return <span className="text-cyan-400 font-bold text-base">{line.slice(3)}</span>;
  if (line.startsWith('# ')) return <span className="text-cyan-400 font-bold text-lg">{line.slice(2)}</span>;

  const metaMatch = line.match(/^- \*\*(.+?):\*\* (.+)$/);
  if (metaMatch) {
    return (
      <span>
        <span className="text-slate-500">- </span>
        <span className="text-slate-400 font-semibold">{metaMatch[1]}:</span>
        <span className="text-white/70"> {metaMatch[2]}</span>
      </span>
    );
  }

  if (line.includes('sessions_spawn')) {
    const parts = line.split('sessions_spawn');
    return (
      <span className="text-white/50">
        {parts[0]}
        <code className="bg-cyan-400/10 text-cyan-300 px-1.5 py-0.5 rounded text-[11px]">sessions_spawn</code>
        {parts[1]}
      </span>
    );
  }

  if (line === '') return <span>&nbsp;</span>;
  return <span className="text-white/50">{line}</span>;
}

// ── Typewriter hook: rAF-driven character-by-character reveal ────────────────

function useTypewriter(lines: string[], charDelay = 12, lineDelay = 80) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const flat: { lineIdx: number; charIdx: number; time: number }[] = [];
    let t = 0;
    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];
      if (line.length === 0) {
        flat.push({ lineIdx: l, charIdx: 0, time: t });
        t += lineDelay;
      } else {
        for (let c = 0; c < line.length; c++) {
          flat.push({ lineIdx: l, charIdx: c + 1, time: t });
          t += charDelay;
        }
        t += lineDelay;
      }
    }

    const totalTime = t;

    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;

      let lastIdx = -1;
      for (let i = 0; i < flat.length; i++) {
        if (flat[i].time <= elapsed) lastIdx = i;
        else break;
      }

      if (lastIdx >= 0) {
        const next = new Array(lines.length).fill('');
        for (let i = 0; i <= lastIdx; i++) {
          const entry = flat[i];
          next[entry.lineIdx] = lines[entry.lineIdx].slice(0, entry.charIdx);
        }
        setVisibleLines([...next]);
      }

      if (elapsed < totalTime) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setVisibleLines([...lines]);
        setDone(true);
      }
    };

    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 400);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [lines, charDelay, lineDelay]);

  return { visibleLines, done };
}

export function IntroCard({ onStart }: IntroCardProps) {
  const { visibleLines, done } = useTypewriter(ORG_LINES, 12, 60);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const lastVisibleIdx = visibleLines.reduce((acc, l, i) => (l && l.length > 0 ? i : acc), -1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/95 backdrop-blur-sm p-4"
    >
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-5xl w-full">
        {/* Left: Terminal panel with typewriter effect */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          className="w-full md:w-[55%] shrink-0"
        >
          <div className="rounded-xl border border-white/10 bg-[#0d1117] shadow-[0_0_40px_rgba(34,211,238,0.08)] max-h-[40vh] md:max-h-none overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              </div>
              <span className="text-white/40 text-xs ml-2 font-mono">org.md</span>
            </div>
            <div ref={containerRef} className="p-4 font-mono text-[13px] leading-relaxed overflow-y-auto max-h-[35vh] md:max-h-[60vh]">
              {ORG_LINES.map((fullLine, i) => {
                const partial = visibleLines[i];
                if (partial === undefined || (partial === '' && fullLine !== '')) return null;
                return (
                  <div key={i} className="flex gap-3">
                    <span className="text-white/10 select-none w-5 text-right shrink-0 text-[11px] leading-relaxed">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      {renderLine(partial)}
                      {!done && i === lastVisibleIdx && (
                        <span className="inline-block w-[2px] h-[14px] bg-cyan-400 ml-0.5 align-middle animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Right: Intro copy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col items-center md:items-start text-center md:text-left"
        >
          <div className="text-7xl mb-4">🍔</div>
          <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Operation:</div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-6">
            10,000 KRABBY PATTIES
          </h1>
          <p className="text-white/50 text-lg mb-1">22 agents. One massive order.</p>
          <p className="text-white/50 text-lg mb-8">Watch them coordinate — or collapse.</p>
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 20 }}
            onClick={onStart}
            className="px-8 py-3 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-semibold rounded-xl hover:bg-cyan-500/30 hover:border-cyan-500/60 transition-all text-lg cursor-pointer"
          >
            Watch the Story →
          </motion.button>
          <p className="text-white/30 text-xs mt-3">Defined in one markdown file.</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
