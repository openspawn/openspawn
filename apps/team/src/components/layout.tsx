import { useState, useCallback } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Coins,
  Activity,
  Network,
  Settings,
  Menu,
  MessageSquare,
  Layers,
  ClipboardList,
  PanelLeft,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { ReactNode } from "react";
import {
  GlobalSearchTrigger,
  GlobalSearchModal,
  useGlobalSearchShortcut,
} from "./global-search";

const BRAND_NAME = "OpenSpawn";
const BRAND_SUBTITLE = "Team Dashboard";

interface LayoutProps {
  children: ReactNode;
}

const fullBleedRoutes = new Set(["/network", "/messages"]);

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Network", href: "/network", icon: Network },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Kanban", href: "/kanban", icon: Layers },
  { name: "Task Board", href: "/task-board", icon: ClipboardList },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Credits", href: "/credits", icon: Coins },
  { name: "Events", href: "/events", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

const SIDEBAR_STORAGE_KEY = "os-sidebar-collapsed";

function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { collapsed, toggle: toggleCollapse } = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFullBleed = fullBleedRoutes.has(location.pathname);
  const [searchOpen, setSearchOpen] = useState(false);

  useGlobalSearchShortcut(() => setSearchOpen(true));

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      {/* Mobile overlay — tap outside to close */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar
          Mobile: fixed, always full-width (w-64), slides in/out.
          Desktop: relative in flex flow; width driven by collapsed state (w-16 / w-64).
      */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[hsl(var(--card))]",
          "transition-[width,transform] duration-200",
          // Mobile: always 256 px, slide in/out
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: relative in flow, width driven by collapse state
          "md:relative md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-64",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4 shrink-0">
          <span className="text-xl">⚡</span>
          {/* Always show brand text on mobile; hide when collapsed on desktop */}
          <div className={cn("flex flex-col", collapsed && "md:hidden")}>
            <span className="text-sm font-bold text-white">{BRAND_NAME}</span>
            <span className="text-[10px] text-white/40">{BRAND_SUBTITLE}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navigation.map((item) => {
            const active = item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80",
                  // Collapsed on desktop: center icon, hide label
                  collapsed && "md:justify-center md:px-0",
                )}
                title={collapsed ? item.name : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {/* Always show label on mobile; hide when desktop-collapsed */}
                <span className={cn(collapsed && "md:hidden")}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/5 p-3 space-y-2 shrink-0">
          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile top bar — hamburger + brand + search trigger */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/5 px-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white/60 hover:text-white transition-colors p-1 -ml-1 rounded-md hover:bg-white/5"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex-1 text-sm font-bold text-white">⚡ {BRAND_NAME}</span>
          <GlobalSearchTrigger onOpen={() => setSearchOpen(true)} />
        </header>

        {/* Desktop search bar — visible above main content on md+ */}
        <div className="hidden md:flex h-12 shrink-0 items-center border-b border-white/5 px-6">
          <GlobalSearchTrigger onOpen={() => setSearchOpen(true)} />
        </div>

        {/* Page content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto",
            isFullBleed ? "" : "p-4 md:p-6 max-w-7xl mx-auto w-full",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
