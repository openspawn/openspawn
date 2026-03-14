import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Layout } from "./components";
import { ProtectedRoute } from "./components/protected-route";
import { TourProvider, TourBar, TourSpotlight } from "./components/tour";
import { CommandPalette } from "./components/command-palette";
import { DashboardPage } from "./pages/dashboard";
import { isSandboxMode } from "@openspawn/dashboard-data";
import { isBBTheme } from "./lib/dashboard-theme";
import type { ReactNode } from "react";

// Check for demo/sandbox mode via URL param or env
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get("demo") === "true" || import.meta.env.VITE_DEMO_MODE === "true";

const reduceMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const variants = reduceMotion
  ? { initial: {}, animate: {}, exit: {} }
  : {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0 },
    };

const transition = reduceMotion
  ? { duration: 0 }
  : { duration: 0.25, ease: [0, 0, 0.2, 1] as [number, number, number, number] };

// In demo/sandbox mode, skip auth protection
function MaybeProtectedRoute({ children }: { children: ReactNode }) {
  if (isDemoMode || isSandboxMode) {
    return <>{children}</>;
  }
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

// Layout wrapper with page transitions
function LayoutWithTransitions() {
  const location = useLocation();
  return (
    <MaybeProtectedRoute>
      <Layout>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={transition}
            style={{ willChange: "opacity, transform" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Layout>
    </MaybeProtectedRoute>
  );
}

// Root route
function RootComponent() {
  return (
    <TourProvider>
      <CommandPalette />
      <TourBar />
      <TourSpotlight />
      <Outlet />
    </TourProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

// Intro page — standalone, no layout
const introRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/intro",
  component: lazyRouteComponent(() => import("./pages/intro"), "IntroPage"),
});

// Live view page — standalone, no layout
const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live",
  component: lazyRouteComponent(() => import("./pages/live-view"), "LiveViewPage"),
});

// Layout route for all pages that use the sidebar layout
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: LayoutWithTransitions,
});

// Child routes under layout
const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: DashboardPage,
});

const tasksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/tasks",
  component: lazyRouteComponent(() => import("./pages/tasks"), "TasksPage"),
});

const agentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/agents",
  component: lazyRouteComponent(() => import("./pages/agents"), "AgentsPage"),
});

const creditsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/credits",
  component: lazyRouteComponent(() => import("./pages/credits"), "CreditsPage"),
});

const eventsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/events",
  component: lazyRouteComponent(() => import("./pages/events"), "EventsPage"),
});

const messagesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/messages",
  component: lazyRouteComponent(() => import("./pages/messages"), "MessagesPage"),
});

const routerPageRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/router",
  component: lazyRouteComponent(() => import("./pages/router"), "RouterPage"),
});

const networkRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/network",
  component: lazyRouteComponent(() => import("./pages/network"), "NetworkPage"),
});

const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  component: lazyRouteComponent(() => import("./pages/settings"), "SettingsPage"),
});

const kanbanRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/kanban",
  component: lazyRouteComponent(() => import("./pages/kanban"), "KanbanPage"),
});

const taskBoardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/task-board",
  component: lazyRouteComponent(() => import("./pages/task-board"), "TaskBoardPage"),
});

const statusRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/status",
  component: lazyRouteComponent(() => import("./pages/mobile-status"), "MobileStatusPage"),
});

const memoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/memory",
  component: lazyRouteComponent(() => import("./pages/memory"), "MemoryPage"),
});

const graphRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/graph",
  component: lazyRouteComponent(() => import("./pages/graph"), "GraphPage"),
});

// Auth routes — only in non-sandbox mode
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: lazyRouteComponent(() => import("./pages/login"), "LoginPage"),
});

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: lazyRouteComponent(() => import("./pages/auth-callback"), "AuthCallbackPage"),
});

// Build route tree
const layoutChildren = [
  indexRoute,
  tasksRoute,
  agentsRoute,
  creditsRoute,
  eventsRoute,
  messagesRoute,
  routerPageRoute,
  networkRoute,
  settingsRoute,
  statusRoute,
  kanbanRoute,
  taskBoardRoute,
  memoryRoute,
  graphRoute,
];

const rootChildren = [
  ...(isBBTheme ? [introRoute, liveRoute] : []),
  layoutRoute.addChildren(layoutChildren),
  ...(!isDemoMode && !isSandboxMode ? [loginRoute, authCallbackRoute] : []),
];

const routeTree = rootRoute.addChildren(rootChildren);

export const router = createRouter({
  routeTree,
  basepath: "/app",
  defaultPreload: "intent",
});

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
