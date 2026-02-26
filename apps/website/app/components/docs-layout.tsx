import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

const sidebar = [
  { label: "Overview", to: "/docs" },
  { label: "Getting Started", to: "/docs/getting-started" },
  { label: "How It Works", to: "/docs/how-it-works" },
  { label: "OpenClaw Integration", to: "/docs/openclaw" },
  {
    label: "Tutorials",
    children: [
      { label: "Your First ORG.md", to: "/docs/tutorials/your-first-org-md" },
    ],
  },
  {
    label: "Guides",
    children: [
      { label: "Connecting Real Agents", to: "/docs/guides/connecting-agents" },
      { label: "Dashboard Guide", to: "/docs/guides/dashboard-guide" },
    ],
  },
  {
    label: "Concepts",
    children: [
      { label: "ACP vs A2A", to: "/docs/concepts/acp-vs-a2a" },
    ],
  },
  {
    label: "Protocols",
    children: [
      { label: "A2A Protocol", to: "/docs/protocols/a2a" },
      { label: "MCP Tools", to: "/docs/protocols/mcp" },
      { label: "MCP Reference", to: "/docs/protocols/mcp-reference" },
    ],
  },
  {
    label: "Features",
    children: [
      { label: "Dashboard", to: "/docs/features/dashboard" },
      { label: "Model Router", to: "/docs/features/model-router" },
    ],
  },
  {
    label: "Reference",
    children: [
      { label: "ORG.md Reference", to: "/docs/reference/org-md-reference" },
    ],
  },
  { label: "Comparison", to: "/docs/comparison" },
];

// Flat ordered list for prev/next navigation
const flatPages = [
  { label: "Overview", to: "/docs" },
  { label: "Getting Started", to: "/docs/getting-started" },
  { label: "How It Works", to: "/docs/how-it-works" },
  { label: "OpenClaw Integration", to: "/docs/openclaw" },
  { label: "Your First ORG.md", to: "/docs/tutorials/your-first-org-md" },
  { label: "Connecting Real Agents", to: "/docs/guides/connecting-agents" },
  { label: "Dashboard Guide", to: "/docs/guides/dashboard-guide" },
  { label: "ACP vs A2A", to: "/docs/concepts/acp-vs-a2a" },
  { label: "A2A Protocol", to: "/docs/protocols/a2a" },
  { label: "MCP Tools", to: "/docs/protocols/mcp" },
  { label: "MCP Reference", to: "/docs/protocols/mcp-reference" },
  { label: "Dashboard", to: "/docs/features/dashboard" },
  { label: "Model Router", to: "/docs/features/model-router" },
  { label: "ORG.md Reference", to: "/docs/reference/org-md-reference" },
  { label: "Comparison", to: "/docs/comparison" },
];

export function DocsLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname.replace(/\/$/, "");

  const currentIdx = flatPages.findIndex((p) => p.to === currentPath);
  const prevPage = currentIdx > 0 ? flatPages[currentIdx - 1] : null;
  const nextPage = currentIdx < flatPages.length - 1 && currentIdx >= 0 ? flatPages[currentIdx + 1] : null;

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

          {/* Prev / Next navigation */}
          {(prevPage || nextPage) && (
            <nav className="mt-16 flex items-center justify-between border-t border-white/5 pt-8 gap-4">
              {prevPage ? (
                <Link
                  to={prevPage.to}
                  className="group flex flex-col items-start rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-sm transition hover:border-white/10 hover:bg-white/[0.04] no-underline min-w-0"
                >
                  <span className="text-xs text-slate-500 mb-1">← Previous</span>
                  <span className="font-medium text-slate-300 group-hover:text-cyan-400 truncate">{prevPage.label}</span>
                </Link>
              ) : <div />}
              {nextPage ? (
                <Link
                  to={nextPage.to}
                  className="group flex flex-col items-end rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-sm transition hover:border-white/10 hover:bg-white/[0.04] no-underline min-w-0 ml-auto"
                >
                  <span className="text-xs text-slate-500 mb-1">Next →</span>
                  <span className="font-medium text-slate-300 group-hover:text-cyan-400 truncate">{nextPage.label}</span>
                </Link>
              ) : <div />}
            </nav>
          )}
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
