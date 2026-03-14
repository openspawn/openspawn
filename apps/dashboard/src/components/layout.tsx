import { useState, useEffect, useRef, useCallback } from "react";
import { useSandboxTickInvalidation } from "../hooks/use-sandbox-tick";
import { Logo } from "./ui/logo";
import { Link, useLocation, useSearch } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Play, Square, Menu, Search, PanelLeft, Star } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { SidePanelShell } from "./ui/side-panel";
import { useSidePanel } from "../contexts";
import { ThemeToggle } from "./theme-toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useDemo } from "../demo";
import { DemoControls } from "../demo/DemoControls";
import { useAuth } from "../contexts";
import { usePresence } from "../hooks";
import { ActiveAgentsBadge } from "./presence";
import { NotificationCenter } from "./notification-center";
// SandboxCommandBar removed — ghost-typing prompt doesn't match replay demo UX
import { ScenarioContextBanner, useScenarioStatus } from "./sandbox-scenario-banner";
import { PhaseTransitionOverlay } from "./phase-transition-overlay";
import { ScenarioEventToasts } from "./scenario-event-toasts";
import { Toaster } from "sonner";
import { isBBTheme } from "../lib/dashboard-theme";
import {
  Sidebar,
  useSidebarCollapsed,
  SIDEBAR_EXPANDED_W,
  SIDEBAR_COLLAPSED_W,
  bottomNavItems,
} from "./sidebar";
import type { ReactNode } from "react";

const BRAND_NAME = isBBTheme ? "BikiniBottom" : "OpenSpawn";
const BRAND_SUBTITLE = isBBTheme ? "Multi-Agent Coordination" : "Team Dashboard";

interface LayoutProps {
  children: ReactNode;
}

/** Routes that should span full width with no max-width or padding constraints */
const fullBleedRoutes = new Set(["/network", "/messages"]);

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const demo = useDemo();
  const isDemo = searchParams?.demo === "true";
  const { user, logout, isAuthenticated } = useAuth();
  const { activeCount } = usePresence();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapsed();
  const sidePanel = useSidePanel();
  const { status: scenarioStatus, phaseTransition, setPhaseTransition } = useScenarioStatus();

  // SSE-driven query invalidation — replaces global refetchInterval polling
  useSandboxTickInvalidation();

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
    window.location.href = "/app/login";
  };

  function handleToggleDemo() {
    const url = new URL(window.location.href);
    if (isDemo) {
      url.searchParams.delete("demo");
    } else {
      url.searchParams.set("demo", "true");
    }
    window.location.href = url.toString();
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background relative">
        {/* Bikini Bottom ambient backdrop — only in BB theme */}
        {isBBTheme && (
          <div
            className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url(/app/bikini-bottom-bg.jpg)", opacity: 0.06 }}
            aria-hidden="true"
          />
        )}

        <Sidebar
          collapsed={sidebarCollapsed}
          sidebarWidth={sidebarWidth}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          isDemo={isDemo}
          handleToggleDemo={handleToggleDemo}
          isAuthenticated={isAuthenticated}
          user={user}
          handleLogout={handleLogout}
          activeCount={activeCount}
        />

        {/* Mobile header */}
        <div className="flex flex-1 flex-col min-w-0">
          <header
            className={cn(
              "flex h-14 sm:h-16 items-center justify-between border-b border-border px-4 lg:hidden relative overflow-hidden sticky top-0 z-30 bg-background transition-transform duration-300",
              !headerVisible && "-translate-y-full",
            )}
          >
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
            <div className="flex items-center gap-2">
              {isDemo && activeCount > 0 && <ActiveAgentsBadge count={activeCount} />}
              {isDemo && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => demo.setIsPlaying(!demo.isPlaying)}
                  className="relative"
                >
                  {demo.isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
          <div className="hidden lg:flex h-16 items-center gap-2 px-6 border-b border-border relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] bg-gradient-to-r from-cyan-500 to-transparent pointer-events-none" />
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={toggleSidebar}
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {sidebarCollapsed ? "Expand" : "Collapse"} sidebar{" "}
                <kbd className="ml-1 text-[10px] opacity-60">⌘[</kbd>
              </TooltipContent>
            </Tooltip>
            <button
              data-tour="cmdk"
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-md hover:bg-muted transition-colors mr-auto"
            >
              <Search className="h-3 w-3" />
              <span>Search…</span>
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">
                ⌘K
              </kbd>
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
              <div
                className={`${fullBleedRoutes.has(location.pathname) ? "h-full" : "mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 max-w-7xl w-full"} ${scenarioStatus ? "pt-12" : ""} pb-16 sm:pb-6`}
              >
                {children}
              </div>
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
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden">
            <div className="flex items-center justify-around h-14">
              {bottomNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] min-h-[44px] transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground",
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

        {/* Command bar removed — ghost-typing prompt didn't match demo UX */}
      </div>

      {/* Scenario experience overlays */}
      <ScenarioContextBanner status={scenarioStatus} />
      <PhaseTransitionOverlay
        transition={phaseTransition}
        onDismiss={() => setPhaseTransition(null)}
      />
      <ScenarioEventToasts />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgb(15, 23, 42)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "rgb(203, 213, 225)",
          },
        }}
      />
    </TooltipProvider>
  );
}
