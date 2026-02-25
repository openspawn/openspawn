import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(3,14,26,0.96)' }}
    >
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-5xl w-full">
        {/* Left: ORG.md terminal */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          className="w-full md:w-[55%] shrink-0"
        >
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
        </motion.div>

        {/* Right: Intro copy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col items-center md:items-start text-center md:text-left"
        >
          <div className="text-7xl mb-4">🍔</div>
          <div
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: 'rgba(184,228,247,0.4)', fontFamily: 'Nunito, sans-serif' }}
          >
            Operation:
          </div>
          <h1
            className="font-black mb-6"
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

          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 32px rgba(244,197,66,0.6)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-lg cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #F4C542 0%, #EAB308 100%)',
              color: '#062A45',
              fontFamily: '"Baloo 2", cursive',
              boxShadow: '0 0 24px rgba(244,197,66,0.4)',
            }}
          >
            <Play className="w-5 h-5" />
            Watch the Story →
          </motion.button>
          <p
            className="text-xs mt-3"
            style={{ color: 'rgba(184,228,247,0.25)', fontFamily: 'Nunito, sans-serif' }}
          >
            Defined in one markdown file.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
