import { useState, useEffect, useCallback } from "react";

const lines = [
  { text: "$ npx openspawn init my-org", color: "text-slate-300", delay: 0 },
  { text: "🪸 Created ORG.md, config, .gitignore", color: "text-emerald-400", delay: 900 },
  { text: "", color: "", delay: 1300 },
  { text: "$ npx openspawn start", color: "text-slate-300", delay: 1500 },
  { text: "🌐 Server running at http://localhost:3333", color: "text-cyan-400", delay: 2400 },
  { text: "🔗 A2A: /.well-known/agent.json", color: "text-violet-400", delay: 2850 },
  { text: "🔌 MCP: /mcp (7 tools)", color: "text-amber-400", delay: 3250 },
  { text: "🔀 Router: 3 providers configured", color: "text-emerald-400", delay: 3700 },
  { text: "📊 Dashboard: http://localhost:3333", color: "text-cyan-400", delay: 4100 },
  { text: "", color: "", delay: 4600 },
  {
    text: "✨ 22 agents ready. Visit http://localhost:3333",
    color: "text-cyan-300 font-semibold",
    delay: 5200,
  },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [key, setKey] = useState(0);

  const startAnimation = useCallback(() => {
    setVisibleLines(0);
    setKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay + Math.random() * 80),
    );
    return () => timers.forEach(clearTimeout);
  }, [key]);

  const isDone = visibleLines >= lines.length;

  return (
    /* terminal-enhanced adds depth glow + scanline pseudo-element */
    <div className="terminal terminal-enhanced mx-auto max-w-2xl">
      <div className="terminal-header flex items-center justify-between">
        <div className="flex gap-2">
          <div className="terminal-dot bg-red-500/80" />
          <div className="terminal-dot bg-yellow-500/80" />
          <div className="terminal-dot bg-green-500/80" />
          <span className="ml-2 text-xs text-slate-600 font-medium tracking-wide">
            openspawn — bash
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
            live
          </span>
          {isDone && (
            <button
              type="button"
              onClick={startAnimation}
              className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-slate-500 transition-all duration-150 hover:bg-white/10 hover:text-cyan-400"
              aria-label="Replay terminal animation"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Replay
            </button>
          )}
        </div>
      </div>
      <div className="relative p-5 min-h-[280px]">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div
            key={`${key}-${i}`}
            className={`${line.color} ${i === visibleLines - 1 ? "animate-fade-in-up" : ""} leading-relaxed`}
          >
            {/* Highlight $ prompt with distinct color */}
            {line.text.startsWith("$") ? (
              <>
                <span className="text-cyan-500/70 select-none">$ </span>
                <span>{line.text.slice(2)}</span>
              </>
            ) : (
              line.text || "\u00A0"
            )}
          </div>
        ))}
        {!isDone && <span className="cursor-blink text-cyan-500/70 font-bold">▋</span>}
      </div>
    </div>
  );
}
