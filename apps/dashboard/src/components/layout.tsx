import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Coins,
  Activity,
  Bot,
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
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ThemeToggle } from "./theme-toggle";
import { TooltipProvider } from "./ui/tooltip";
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
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Network", href: "/network", icon: Network },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Credits", href: "/credits", icon: Coins },
  { name: "Events", href: "/events", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const demo = useDemo();
  const isDemo = searchParams.get("demo") === "true";
  const { user, logout, isAuthenticated } = useAuth();

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
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-border lg:flex">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-border px-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <Bot className="h-6 w-6 text-primary" style={{ animation: "wave-subtle 6s ease-in-out infinite" }} />
            <div className="flex flex-col">
              <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                BikiniBottom
              </span>
              <span className="text-[9px] text-muted-foreground tracking-wide">
                Multi-Agent Coordination
              </span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "bg-secondary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Demo Toggle */}
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

          {/* Help Links */}
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

          {/* User & Footer */}
          <div className="border-t border-border p-4 space-y-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">{user.name}</span>
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
            ) : !isDemo ? (
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
        </aside>

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
            <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" style={{ animation: "wave-subtle 6s ease-in-out infinite" }} />
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
                        "w-full justify-start gap-3",
                        isActive && "bg-secondary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Drawer demo toggle */}
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

        {/* Mobile header */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:hidden relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" style={{ animation: "wave-subtle 6s ease-in-out infinite" }} />
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
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </Button>
              )}
              <ThemeToggle />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-4 sm:p-6 pb-20">{children}</div>
            
            {/* Footer Badge */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur-sm border-t border-slate-800/50 px-4 py-2 z-30">
              <div className="container mx-auto flex items-center justify-between text-xs">
                <a
                  href="https://github.com/openspawn/openspawn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <span className="text-base">🌊</span>
                  <span className="font-medium">BikiniBottom</span>
                  <span className="hidden sm:inline">—</span>
                  <span className="hidden sm:inline">Open Source Multi-Agent Coordination</span>
                </a>
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/openspawn/openspawn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-md text-slate-300 hover:text-white transition-all group"
                  >
                    <Github className="h-3 w-3" />
                    <span className="font-medium">Star</span>
                    <img 
                      src="https://img.shields.io/github/stars/openspawn/openspawn?style=social" 
                      alt="GitHub stars" 
                      className="h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    />
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
