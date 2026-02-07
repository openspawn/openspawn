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
  { name: "Credits", href: "/credits", icon: Coins },
  { name: "Events", href: "/events", icon: Activity },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const demo = useDemo();
  const isDemo = searchParams.get("demo") === "true";
  const { user, logout, isAuthenticated } = useAuth();

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
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">OpenSpawn</span>
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

        {/* Mobile header */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:hidden">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">OpenSpawn</span>
            </div>
            <ThemeToggle />
          </header>

          {/* Mobile navigation */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
