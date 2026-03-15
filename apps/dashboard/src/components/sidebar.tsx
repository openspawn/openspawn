import { useState, useCallback } from "react";
import { Logo } from "./ui/logo";
import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Coins,
  Activity,
  Network,
  Play,
  Square,
  LogOut,
  User,
  Settings,
  X,
  MessageSquare,
  GitBranch,
  BookOpen,
  ExternalLink,
  HelpCircle,
  Github,
  Brain,
  Share2,
  Layers,
  ClipboardList,
  ShieldCheck,
  Signal,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { DemoControls } from "../demo/DemoControls";
import { isSandboxMode } from "@openspawn/dashboard-data";
import { ProtocolStatus } from "./protocol-status";
import { ProtocolActivity } from "./protocol-activity";
import { ActiveAgentsBadge } from "./presence";
import { ThemeToggle } from "./theme-toggle";
import { isBBTheme } from "../lib/dashboard-theme";

const BRAND_NAME = isBBTheme ? "BikiniBottom" : "OpenSpawn";
const BRAND_SUBTITLE = isBBTheme ? "Multi-Agent Coordination" : "Team Dashboard";

export const SIDEBAR_EXPANDED_W = 256; // 16rem = w-64
export const SIDEBAR_COLLAPSED_W = 64;
const SIDEBAR_STORAGE_KEY = "bb-sidebar-collapsed";

export const navigation: {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  tourId?: string;
  shortcut?: string;
}[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, tourId: "dashboard", shortcut: "g d" },
  { name: "Network", href: "/network", icon: Network, tourId: "network", shortcut: "g n" },
  { name: "Tasks", href: "/tasks", icon: CheckSquare, tourId: "tasks", shortcut: "g t" },
  { name: "Kanban", href: "/kanban", icon: Layers },
  { name: "Task Board", href: "/task-board", icon: ClipboardList },
  { name: "Agents", href: "/agents", icon: Users, tourId: "agents", shortcut: "g a" },
  { name: "Messages", href: "/messages", icon: MessageSquare, shortcut: "g m" },
  { name: "Model Router", href: "/router", icon: GitBranch },
  { name: "Credits", href: "/credits", icon: Coins, shortcut: "g c" },
  { name: "Approvals", href: "/approvals", icon: ShieldCheck, shortcut: "g p" },
  { name: "Events", href: "/events", icon: Activity, shortcut: "g e" },
  { name: "Memory", href: "/memory", icon: Brain },
  { name: "Graph", href: "/graph", icon: Share2 },
  { name: "Settings", href: "/settings", icon: Settings, shortcut: "g s" },
];

export const bottomNavItems: { name: string; href: string; icon: typeof LayoutDashboard }[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Status", href: "/status", icon: Signal },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Messages", href: "/messages", icon: MessageSquare },
];

export function useSidebarCollapsed() {
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

  return { collapsed, toggle } as const;
}

interface SidebarProps {
  collapsed: boolean;
  sidebarWidth: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isDemo: boolean;
  handleToggleDemo: () => void;
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  handleLogout: () => void;
  activeCount: number;
}

export function Sidebar({
  collapsed,
  sidebarWidth,
  mobileMenuOpen,
  setMobileMenuOpen,
  isDemo,
  handleToggleDemo,
  isAuthenticated,
  user,
  handleLogout,
  activeCount,
}: SidebarProps) {
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        className="hidden flex-shrink-0 flex-col border-r border-border lg:flex overflow-hidden"
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-border relative overflow-hidden",
            collapsed ? "justify-center px-2" : "px-4",
          )}
        >
          <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-cyan-500 to-blue-600 pointer-events-none" />
          <Logo
            size="sm"
            style={isBBTheme ? { animation: "wave-subtle 6s ease-in-out infinite" } : undefined}
          />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden whitespace-nowrap"
            >
              <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {BRAND_NAME}
              </span>
              <span className="text-[9px] text-muted-foreground tracking-wide">
                {BRAND_SUBTITLE}
              </span>
            </motion.div>
          )}
          {!collapsed && isDemo && activeCount > 0 && (
            <div className="ml-auto">
              <ActiveAgentsBadge count={activeCount} />
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const linkContent = (
                <Link
                  key={item.name}
                  to={item.href}
                  className="relative block"
                  data-testid={`nav-link-${item.name.toLowerCase()}`}
                  {...(item.tourId ? { "data-tour": item.tourId } : {})}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-md bg-secondary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full relative z-10",
                      collapsed ? "justify-center px-0" : "justify-start gap-3",
                      isActive && "text-primary hover:bg-transparent",
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap flex-1 text-left"
                        >
                          {item.name}
                        </motion.span>
                        {item.shortcut && (
                          <kbd className="ml-auto text-[10px] font-mono text-muted-foreground/50 tracking-wider">
                            {item.shortcut}
                          </kbd>
                        )}
                      </>
                    )}
                  </Button>
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.name} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.name}
                      {item.shortcut && (
                        <kbd className="ml-2 text-[10px] font-mono text-muted-foreground/70">
                          {item.shortcut}
                        </kbd>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return linkContent;
            })}
          </nav>
        </ScrollArea>

        {/* Demo Toggle — hidden in sandbox mode (bikinibottom.ai) */}
        {!isSandboxMode &&
          (!collapsed ? (
            <div className="border-t border-border p-3">
              <Button
                onClick={handleToggleDemo}
                variant={isDemo ? "default" : "outline"}
                size="sm"
                className="w-full gap-2"
              >
                {isDemo ? (
                  <>
                    <Square className="h-3 w-3" />
                    Exit Demo
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    Demo Mode
                  </>
                )}
              </Button>
              {isDemo && (
                <div className="mt-2">
                  <DemoControls compact />
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-border p-2 flex justify-center">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleToggleDemo}
                    variant={isDemo ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                  >
                    {isDemo ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {isDemo ? "Exit Demo" : "Demo Mode"}
                </TooltipContent>
              </Tooltip>
            </div>
          ))}

        {/* Help Links */}
        {!collapsed ? (
          <div className="border-t border-border px-3 py-2">
            <div className="flex flex-col gap-1">
              <a
                href="https://openspawn.github.io/openspawn/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Documentation
                <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
              </a>
              <a
                href="https://github.com/openspawn/openspawn"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
              </a>
              <button
                onClick={() =>
                  window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }))
                }
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors w-full text-left"
              >
                <HelpCircle className="h-4 w-4" />
                Keyboard Shortcuts
                <kbd className="ml-auto text-[10px] font-mono text-muted-foreground/50">?</kbd>
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border py-2 flex flex-col items-center gap-1">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <a
                  href="https://openspawn.github.io/openspawn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Documentation
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/openspawn/openspawn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                GitHub
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Protocol Status */}
        {isSandboxMode &&
          (!collapsed ? (
            <div className="border-t border-border px-3 py-2 space-y-2">
              <ProtocolStatus />
              <ProtocolActivity />
            </div>
          ) : (
            <div className="border-t border-border py-2 flex flex-col items-center gap-1">
              <ProtocolStatus compact />
            </div>
          ))}

        {/* User & Footer */}
        {!collapsed ? (
          <div className="border-t border-border p-4 space-y-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left overflow-hidden">
                      <span className="text-sm font-medium truncate">{user.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isDemo && !isSandboxMode ? (
              <Link to="/login">
                <Button variant="outline" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
            ) : null}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>v0.1.0</span>
              <ThemeToggle />
            </div>
          </div>
        ) : (
          <div className="border-t border-border py-3 flex flex-col items-center gap-2">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isDemo && !isSandboxMode ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link to="/login">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Sign in
                </TooltipContent>
              </Tooltip>
            ) : null}
            <ThemeToggle />
          </div>
        )}
      </motion.aside>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border transform transition-transform duration-200 ease-in-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-cyan-500 to-blue-600 pointer-events-none" />
          <div className="flex items-center gap-2">
            <Logo
              size="sm"
              style={isBBTheme ? { animation: "wave-subtle 6s ease-in-out infinite" } : undefined}
            />
            <div className="flex flex-col">
              <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {BRAND_NAME}
              </span>
              <span className="text-[9px] text-muted-foreground tracking-wide">
                {BRAND_SUBTITLE}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Drawer navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 min-h-[44px]",
                      isActive && "bg-secondary text-primary",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Drawer demo toggle — hidden in sandbox mode */}
        {!isSandboxMode && (
          <div className="border-t border-border p-3">
            <Button
              onClick={handleToggleDemo}
              variant={isDemo ? "default" : "outline"}
              size="sm"
              className="w-full gap-2"
            >
              {isDemo ? (
                <>
                  <Square className="h-3 w-3" />
                  Exit Demo
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Demo Mode
                </>
              )}
            </Button>
            {isDemo && (
              <div className="mt-2">
                <DemoControls compact />
              </div>
            )}
          </div>
        )}

        {/* Drawer help links */}
        <div className="border-t border-border px-3 py-2">
          <div className="flex flex-col gap-1">
            <a
              href="https://openspawn.github.io/openspawn/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Documentation
              <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
            </a>
            <a
              href="https://github.com/openspawn/openspawn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
              <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
            </a>
          </div>
        </div>

        {/* Drawer footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>v0.1.0</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
