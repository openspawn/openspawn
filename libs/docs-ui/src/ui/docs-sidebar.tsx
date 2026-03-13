import { Link, useRouterState } from "@tanstack/react-router";

export interface SidebarItem {
  label: string;
  to?: string;
  children?: Array<{ label: string; to: string }>;
}

interface DocsSidebarProps {
  items: SidebarItem[];
  open: boolean;
}

export function DocsSidebar({ items, open }: DocsSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname.replace(/\/$/, "");

  return (
    <aside className={`w-56 shrink-0 ${open ? "block" : "hidden"} md:block`}>
      <nav className="sticky top-20 space-y-1 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {items.map((item) =>
          item.children ? (
            <div key={item.label} className="mt-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {item.label}
              </div>
              {item.children.map((child) => (
                <Link
                  key={child.to}
                  to={child.to}
                  className={`block rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400 ${currentPath === child.to ? "text-cyan-400 bg-cyan-500/10" : ""}`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ) : item.to ? (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400 ${currentPath === item.to ? "text-cyan-400 bg-cyan-500/10" : ""}`}
            >
              {item.label}
            </Link>
          ) : null,
        )}
      </nav>
    </aside>
  );
}
