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
  ClipboardList,
  PanelLeft,
  Brain,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { ReactNode } from "react";
import { SidePanelShell } from "@openspawn/dashboard-ui";
import { useSidePanel } from "@openspawn/dashboard-data";
import { GlobalSearchTrigger, GlobalSearchModal, useGlobalSearchShortcut } from "./global-search";

const BRAND_NAME = "OpenSpawn";
const BRAND_SUBTITLE = "Team Dashboard";

interface LayoutProps {
  children: ReactNode;
}

const fullBleedRoutes = new Set(["/network", "/messages"]);

/* ── Grouped navigation ─────────────────────────────────────────── */

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Network", href: "/network", icon: Network },
    ],
  },
  {
    label: "Work",
    items: [
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Task Board", href: "/task-board", icon: ClipboardList },
      { name: "Messages", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Team",
    items: [
      { name: "Agents", href: "/agents", icon: Users },
      { name: "Credits", href: "/credits", icon: Coins },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Events", href: "/events", icon: Activity },
      { name: "Memory", href: "/memory", icon: Brain },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/* ── Mock agent status (replace with real data later) ────────── */

interface AgentStatus {
  id: string;
  name: string;
  status: "active" | "idle";
}

const onlineAgents: AgentStatus[] = [
  { id: "dennis", name: "Dennis", status: "active" },
  { id: "ceo", name: "CEO", status: "active" },
  { id: "drinkify", name: "Drinkify", status: "idle" },
];

/* ── Sidebar state ───────────────────────────────────────────── */

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
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}

/* ── Side panel overlay ──────────────────────────────────────── */

function SidePanelOverlay() {
  const { isOpen, content, width, title, setWidth, closeSidePanel } = useSidePanel();
  if (!isOpen || !content) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={closeSidePanel} />
      <div className="fixed inset-y-0 right-0 z-50 bg-[hsl(var(--background))]">
        <SidePanelShell
          title={title}
          onClose={closeSidePanel}
          width={width}
          onWidthChange={setWidth}
        >
          {content}
        </SidePanelShell>
      </div>
    </>
  );
}

/* ── Layout ──────────────────────────────────────────────────── */

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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[hsl(var(--card))]",
          "transition-[width,transform] duration-200",
          // Mobile: always full-width, slides in/out
          "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: relative in flow, width driven by collapse state
          "md:relative md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-72",
        )}
      >
        {/* ── Brand ──────────────────────────────────────────── */}
        <div className="flex h-18 items-center gap-3 border-b border-white/5 px-5 shrink-0">
          <span className="text-2xl">⚡</span>
          <div className={cn("flex flex-col", collapsed && "md:hidden")}>
            <span className="text-sm font-bold text-white">{BRAND_NAME}</span>
            <span className="text-[10px] text-white/40">{BRAND_SUBTITLE}</span>
          </div>
        </div>

        {/* ── Navigation (grouped) ───────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                {/* Section header */}
                <div
                  className={cn(
                    "mb-2",
                    collapsed
                      ? "md:border-t md:border-white/5 md:mx-2 md:pt-0 md:mb-3"
                      : "",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider text-white/30 px-3",
                      collapsed && "md:hidden",
                    )}
                  >
                    {group.label}
                  </span>
                </div>

                {/* Nav items */}
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const active =
                      item.href === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-white/[0.08] text-white font-medium"
                            : "text-white/50 hover:bg-white/5 hover:text-white/80",
                          // Collapsed on desktop: center icon, hide label
                          collapsed && "md:justify-center md:px-0",
                        )}
                        title={collapsed ? item.name : undefined}
                        onClick={() => setMobileOpen(false)}
                      >
                        {/* Active accent bar */}
                        {active && (
                          <div
                            className={cn(
                              "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-emerald-400",
                              collapsed && "md:left-0.5",
                            )}
                          />
                        )}
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className={cn(collapsed && "md:hidden")}>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* ── Agent status widget ────────────────────────────── */}
        <div className="border-t border-white/5 px-4 py-3 shrink-0">
          <div
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-2",
              collapsed && "md:hidden",
            )}
          >
            Agents Online
          </div>
          <div
            className={cn(
              "flex flex-wrap gap-x-3 gap-y-1.5",
              collapsed && "md:flex-col md:items-center md:gap-2",
            )}
          >
            {onlineAgents.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex items-center gap-1.5",
                  collapsed && "md:justify-center",
                )}
                title={collapsed ? `${a.name} — ${a.status}` : undefined}
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    a.status === "active" ? "bg-emerald-400" : "bg-white/20",
                  )}
                />
                <span className={cn("text-xs text-white/50", collapsed && "md:hidden")}>
                  {a.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Collapse toggle (desktop only) ─────────────────── */}
        <div className="border-t border-white/5 p-3 shrink-0">
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

      {/* ── Main content area ────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
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

        {/* Desktop search bar */}
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

      {/* Shared SidePanel */}
      <SidePanelOverlay />
    </div>
  );
}
