import { useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { DocsSidebar, type SidebarItem } from "./docs-sidebar";
import { DocsPagination, type FlatPage } from "./docs-pagination";

interface DocsLayoutProps {
  children: ReactNode;
  sidebar: SidebarItem[];
  flatPages: FlatPage[];
}

export function DocsLayout({ children, sidebar, flatPages }: DocsLayoutProps) {
  const [open, setOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname.replace(/\/$/, "");

  const currentIdx = flatPages.findIndex((p) => p.to === currentPath);
  const prevPage = currentIdx > 0 ? flatPages[currentIdx - 1] : null;
  const nextPage =
    currentIdx < flatPages.length - 1 && currentIdx >= 0 ? flatPages[currentIdx + 1] : null;

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
        <DocsSidebar items={sidebar} open={open} />
        <div className="min-w-0 flex-1">
          {children}
          <DocsPagination prev={prevPage} next={nextPage} />
        </div>
      </div>
    </div>
  );
}
