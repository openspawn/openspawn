import { useState, useEffect } from "react";

const lines = [
  { text: "$ npx bikinibottom init my-reef", color: "text-slate-300", delay: 0 },
  { text: "🍍 Created ORG.md, config, .gitignore", color: "text-emerald-400", delay: 800 },
  { text: "", color: "", delay: 1200 },
  { text: "$ npx bikinibottom start", color: "text-slate-300", delay: 1400 },
  { text: "🌐 Server running at http://localhost:3333", color: "text-cyan-400", delay: 2200 },
  { text: "🔗 A2A: /.well-known/agent.json", color: "text-violet-400", delay: 2600 },
  { text: "🔌 MCP: /mcp (7 tools)", color: "text-amber-400", delay: 3000 },
  { text: "🔀 Router: 3 providers configured", color: "text-emerald-400", delay: 3400 },
  { text: "📊 Dashboard: http://localhost:3333", color: "text-cyan-400", delay: 3800 },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="terminal glow-cyan mx-auto max-w-2xl">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/80" />
        <div className="terminal-dot bg-yellow-500/80" />
        <div className="terminal-dot bg-green-500/80" />
      </div>
      <div className="p-5 min-h-[260px]">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`${line.color} ${i === visibleLines - 1 ? "animate-fade-in-up" : ""}`}>
            {line.text || "\u00A0"}
          </div>
        ))}
        {visibleLines < lines.length && (
          <span className="cursor-blink text-slate-500">▋</span>
        )}
      </div>
    </div>
  );
}
