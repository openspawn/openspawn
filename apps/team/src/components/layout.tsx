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
  X,
  MessageSquare,
  Layers,
  ClipboardList,
  LogOut,
  PanelLeft,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts";
import type { ReactNode } from "react";

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

const SIDEBAR_EXPANDED_W = 256;
const SIDEBAR_COLLAPSED_W = 64;
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
  const { user, logout } = useAuth();
  const { collapsed, toggle: toggleCollapse } = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFullBleed = fullBleedRoutes.has(location.pathname);
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[hsl(var(--card))] transition-all duration-200",
          "md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ width: sidebarW }}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
          <span className="text-xl">⚡</span>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{BRAND_NAME}</span>
              <span className="text-[10px] text-white/40">{BRAND_SUBTITLE}</span>
            </div>
          )}
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
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/5 p-3 space-y-2">
          <button
            onClick={toggleCollapse}
            className="hidden md:flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
          >
            <PanelLeft className="h-4 w-4" />
            {!collapsed && <span>Collapse</span>}
          </button>
          {user && (
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-white/5 px-4 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-white/60">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-white">⚡ {BRAND_NAME}</span>
        </header>

        {/* Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto",
            isFullBleed ? "" : "p-4 md:p-6 max-w-7xl mx-auto w-full"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
