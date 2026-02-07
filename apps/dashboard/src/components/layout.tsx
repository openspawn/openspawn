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
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ThemeToggle } from "./theme-toggle";
import { TooltipProvider } from "./ui/tooltip";
import { useDemo } from "../demo";
import { DemoControls } from "../demo/DemoControls";
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

          {/* Footer */}
          <div className="border-t border-border p-4">
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
