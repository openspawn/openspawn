import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

const sidebar = [
  { label: "Overview", to: "/docs" },
  { label: "Getting Started", to: "/docs/getting-started" },
  {
    label: "Protocols",
    children: [
      { label: "A2A Protocol", to: "/docs/protocols/a2a" },
      { label: "MCP Tools", to: "/docs/protocols/mcp" },
    ],
  },
  {
    label: "Features",
    children: [
      { label: "Dashboard", to: "/docs/features/dashboard" },
      { label: "Model Router", to: "/docs/features/model-router" },
    ],
  },
];

export function DocsLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="md:hidden mb-4">
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300"
        >
          ☰ Menu
        </button>
      </div>
      <div className="flex gap-10">
        <aside className={`w-56 shrink-0 ${open ? "block" : "hidden"} md:block`}>
          <nav className="sticky top-20 space-y-1">
            {sidebar.map((item) =>
              "children" in item ? (
                <div key={item.label} className="mt-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </div>
                  {item.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      className="block rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400 [&.active]:text-cyan-400 [&.active]:bg-cyan-500/10"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400 [&.active]:text-cyan-400 [&.active]:bg-cyan-500/10"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="terminal my-4">
      {title && (
        <div className="terminal-header">
          <span className="text-xs text-slate-500">{title}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-300">
        <code>{children}</code>
      </pre>
    </div>
  );
}
