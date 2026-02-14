import { useState, useEffect, useRef, useCallback } from "react";
import { Logo } from "./ui/logo";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
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
  Menu,
  X,
  MessageSquare,
  BookOpen,
  ExternalLink,
  HelpCircle,
  Github,
  Search,
  Signal,
  ChevronLeft,
  Star,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { SidePanelShell } from "./ui/side-panel";
import { useSidePanel } from "../contexts";
import { ThemeToggle } from "./theme-toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useDemo } from "../demo";
import { DemoControls } from "../demo/DemoControls";
import { useAuth } from "../contexts";
import { usePresence } from "../hooks";
import { ActiveAgentsBadge } from "./presence";
import { NotificationCenter } from "./notification-center";
import { useOnboarding } from "./onboarding/onboarding-provider";
import { isSandboxMode } from "../graphql/fetcher";
import { SandboxCommandBar } from "./sandbox-command-bar";
import { ProtocolStatus } from "./protocol-status";
import { ProtocolActivity } from "./protocol-activity";
import { ScenarioContextBanner, useScenarioStatus } from "./sandbox-scenario-banner";
import { PhaseTransitionOverlay } from "./phase-transition-overlay";
import { ScenarioEventToasts } from "./scenario-event-toasts";
import { FirstVisitOverlay } from "./first-visit-overlay";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

/** Routes that should span full width with no max-width or padding constraints */
const fullBleedRoutes = new Set(["/network", "/messages"]);

const navigation: { name: string; href: string; icon: typeof LayoutDashboard; tourId?: string }[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, tourId: "dashboard" },
  { name: "Network", href: "/network", icon: Network, tourId: "network" },
  { name: "Tasks", href: "/tasks", icon: CheckSquare, tourId: "tasks" },
  { name: "Agents", href: "/agents", icon: Users, tourId: "agents" },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Credits", href: "/credits", icon: Coins },
  { name: "Events", href: "/events", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Bottom nav items for mobile (subset of main nav)
const bottomNavItems: { name: string; href: string; icon: typeof LayoutDashboard }[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Status", href: "/status", icon: Signal },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Messages", href: "/messages", icon: MessageSquare },
];

const SIDEBAR_EXPANDED_W = 256; // 16rem = w-64
const SIDEBAR_COLLAPSED_W = 64;
const SIDEBAR_STORAGE_KEY = "bb-sidebar-collapsed";

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

  return { collapsed, toggle } as const;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const demo = useDemo();
  const isDemo = searchParams.get("demo") === "true";
  const { user, logout, isAuthenticated } = useAuth();
  const { activeCount } = usePresence();
  const { resetOnboarding, hasCompletedOnboarding } = useOnboarding();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapsed();
  const sidePanel = useSidePanel();
  const { status: scenarioStatus, phaseTransition, setPhaseTransition } = useScenarioStatus();

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  // Scroll direction tracking for hiding mobile header
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainContentRef = useRef<HTMLElement>(null);

  const handleScroll = useCallback(() => {
    const el = mainContentRef.current;
    if (!el) return;
    const currentScrollY = el.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 64) {
      setHeaderVisible(false); // scrolling down
    } else {
      setHeaderVisible(true); // scrolling up
    }
    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    const el = mainContentRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  function handleToggleDemo() {
    if (isDemo) {
      searchParams.delete("demo");
    } else {
      searchParams.set("demo", "true");
    }
    setSearchParams(searchParams);
    window.location.reload();
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background relative">
        {/* Bikini Bottom ambient backdrop */}
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/bikini-bottom-bg.jpg)', opacity: 0.06 }}
          aria-hidden="true"
        />
        {/* Sidebar */}
        <motion.aside
          className="hidden flex-shrink-0 flex-col border-r border-border lg:flex overflow-hidden"
          animate={{ width: sidebarWidth }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Logo + collapse toggle */}
          <div className="flex h-16 items-center gap-2 border-b border-border px-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-cyan-500 to-blue-600 pointer-events-none" />
            <Logo size="sm" style={{ animation: "wave-subtle 6s ease-in-out infinite" }} />
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  BikiniBottom
                </span>
                <span className="text-[9px] text-muted-foreground tracking-wide">
                  Multi-Agent Coordination
                </span>
              </motion.div>
            )}
            <div className="ml-auto flex items-center gap-1">
              {!sidebarCollapsed && isDemo && activeCount > 0 && (
                <ActiveAgentsBadge count={activeCount} />
              )}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={toggleSidebar}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    <motion.div
                      animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {sidebarCollapsed ? "Expand" : "Collapse"} <kbd className="ml-1 text-[10px] opacity-60">⌘[</kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const linkContent = (
                  <Link key={item.name} to={item.href} className="relative block" data-testid={`nav-link-${item.name.toLowerCase()}`} {...(item.tourId ? { 'data-tour': item.tourId } : {})}>
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
                        sidebarCollapsed ? "justify-center px-0" : "justify-start gap-3",
                        isActive && "text-primary hover:bg-transparent"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </Button>
                  </Link>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.name} delayDuration={0}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return linkContent;
              })}
            </nav>
          </ScrollArea>

          {/* Demo Toggle — hidden in sandbox mode (bikinibottom.ai) */}
          {!isSandboxMode && (!sidebarCollapsed ? (
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
          {!sidebarCollapsed ? (
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
                {hasCompletedOnboarding && (
                  <button
                    onClick={resetOnboarding}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors w-full text-left"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Restart Tour
                  </button>
                )}
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
                <TooltipContent side="right" sideOffset={8}>Documentation</TooltipContent>
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
                <TooltipContent side="right" sideOffset={8}>GitHub</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Protocol Status */}
          {isSandboxMode && (
            !sidebarCollapsed ? (
              <div className="border-t border-border px-3 py-2 space-y-2">
                <ProtocolStatus />
                <ProtocolActivity />
              </div>
            ) : (
              <div className="border-t border-border py-2 flex flex-col items-center gap-1">
                <ProtocolStatus compact />
              </div>
            )
          )}

          {/* User & Footer */}
          {!sidebarCollapsed ? (
            <div className="border-t border-border p-4 space-y-3">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
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
                        <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings/profile" className="flex items-center gap-2">
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
              ) : (!isDemo && !isSandboxMode) ? (
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
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings/profile" className="flex items-center gap-2">
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
              ) : (!isDemo && !isSandboxMode) ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link to="/login">
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <User className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>Sign in</TooltipContent>
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
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Drawer header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-cyan-500 to-blue-600 pointer-events-none" />
            <div className="flex items-center gap-2">
              <Logo size="sm" style={{ animation: "wave-subtle 6s ease-in-out infinite" }} />
              <div className="flex flex-col">
              <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                BikiniBottom
              </span>
              <span className="text-[9px] text-muted-foreground tracking-wide">
                Multi-Agent Coordination
              </span>
            </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
            >
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
                        isActive && "bg-secondary text-primary"
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
              {hasCompletedOnboarding && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    resetOnboarding();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors w-full text-left"
                >
                  <HelpCircle className="h-4 w-4" />
                  Restart Tour
                </button>
              )}
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

        {/* Mobile header */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className={cn(
            "flex h-14 sm:h-16 items-center justify-between border-b border-border px-4 lg:hidden relative overflow-hidden sticky top-0 z-30 bg-background transition-transform duration-300",
            !headerVisible && "-translate-y-full"
          )}>
            <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-cyan-500 to-blue-600 pointer-events-none" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Logo size="sm" style={{ animation: "wave-subtle 6s ease-in-out infinite" }} />
              <div className="flex flex-col">
              <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                BikiniBottom
              </span>
              <span className="text-[9px] text-muted-foreground tracking-wide">
                Multi-Agent Coordination
              </span>
            </div>
            </div>
            <div className="flex items-center gap-2">
              {isDemo && activeCount > 0 && (
                <ActiveAgentsBadge count={activeCount} />
              )}
              {isDemo && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => demo.setIsPlaying(!demo.isPlaying)}
                  className="relative"
                >
                  {demo.isPlaying ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {demo.isPlaying && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </Button>
              )}
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </header>

          {/* Desktop top bar — aligned with sidebar header */}
          <div className="hidden lg:flex h-16 items-center justify-end gap-2 px-6 border-b border-border relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] bg-gradient-to-r from-cyan-500 to-transparent pointer-events-none" />
            <button
              data-tour="cmdk"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-md hover:bg-muted transition-colors mr-auto"
            >
              <Search className="h-3 w-3" />
              <span>Search…</span>
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">⌘K</kbd>
            </button>
            {/* Demo controls inline in header */}
            {isDemo && <DemoControls header />}
            {isDemo && <div className="w-px h-6 bg-border" />}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/openspawn/openspawn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Star</span>
                </a>
              </TooltipTrigger>
              <TooltipContent>Star on GitHub</TooltipContent>
            </Tooltip>
            <NotificationCenter />
            <ThemeToggle />
          </div>

          {/* Main content + side panel */}
          <div className="flex flex-1 min-h-0">
            <main ref={mainContentRef} className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
              <div className={`${fullBleedRoutes.has(location.pathname) ? 'h-full' : 'mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 max-w-7xl w-full'} ${scenarioStatus ? 'pt-12' : ''} pb-24 sm:pb-20`}>{children}</div>
            </main>

            {/* Global Side Panel - desktop: inline, mobile: full-screen overlay */}
            <AnimatePresence>
              {sidePanel.isOpen && sidePanel.content && (
                <>
                  {/* Mobile: full-screen overlay */}
                  <motion.div
                    key="side-panel-mobile"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="fixed inset-0 z-[70] bg-background md:hidden overflow-hidden"
                    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                  >
                    <SidePanelShell
                      title={sidePanel.title}
                      onClose={sidePanel.closeSidePanel}
                      width={sidePanel.width}
                      onWidthChange={sidePanel.setWidth}
                    >
                      {sidePanel.content}
                    </SidePanelShell>
                  </motion.div>

                  {/* Desktop: inline panel */}
                  <motion.div
                    key="side-panel-desktop"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: sidePanel.width, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="hidden md:block flex-shrink-0 border-l border-border overflow-hidden h-full"
                  >
                    <SidePanelShell
                      title={sidePanel.title}
                      onClose={sidePanel.closeSidePanel}
                      width={sidePanel.width}
                      onWidthChange={sidePanel.setWidth}
                    >
                      {sidePanel.content}
                    </SidePanelShell>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile bottom navigation bar */}
          <nav className={`fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden ${isSandboxMode ? 'bottom-[52px]' : ''}`}>
            <div className="flex items-center justify-around h-14">
              {bottomNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] min-h-[44px] transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Sandbox command bar — fixed at bottom */}
        <SandboxCommandBar />
      </div>

      {/* Scenario experience overlays */}
      <ScenarioContextBanner status={scenarioStatus} />
      <PhaseTransitionOverlay
        transition={phaseTransition}
        onDismiss={() => setPhaseTransition(null)}
      />
      <ScenarioEventToasts />
      <FirstVisitOverlay />
    </TooltipProvider>
  );
}
