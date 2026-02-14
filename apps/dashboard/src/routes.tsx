import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "./components";
import { ProtectedRoute } from "./components/protected-route";
import { TasksPage, AgentsPage, CreditsPage, EventsPage, LoginPage, AuthCallbackPage, SettingsPage, MessagesPage } from "./pages";
import { RouterPage } from "./pages/router";
import { DashboardPage } from "./pages/dashboard";
import { NetworkPage } from "./pages/network";
import { IntroPage } from "./pages/intro";
import { MobileStatusPage } from "./pages/mobile-status";
import { isSandboxMode } from "./graphql/fetcher";
import type { ReactNode } from "react";

// Check for demo/sandbox mode via URL param or env
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
const rootRoute = createRootRoute({
  component: Outlet,
});

// Intro page — standalone, no layout
const introRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/intro",
  component: IntroPage,
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
  component: TasksPage,
});

const agentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/agents",
  component: AgentsPage,
});

const creditsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/credits",
  component: CreditsPage,
});

const eventsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/events",
  component: EventsPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/messages",
  component: MessagesPage,
});

const routerPageRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/router",
  component: RouterPage,
});

const networkRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/network",
  component: NetworkPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  component: SettingsPage,
});

const statusRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/status",
  component: MobileStatusPage,
});

// Auth routes — only in non-sandbox mode
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: AuthCallbackPage,
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
];

const rootChildren = [
  introRoute,
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
