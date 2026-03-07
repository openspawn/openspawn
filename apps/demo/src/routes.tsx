import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Layout } from "./components";
import { TourProvider, TourBar, TourSpotlight } from "./components/tour";
import { CommandPalette } from "./components/command-palette";
import {
  TasksPage,
  AgentsPage,
  CreditsPage,
  EventsPage,
  SettingsPage,
  MessagesPage,
} from "./pages";
import { KanbanPage } from "./pages/kanban";
import { TaskBoardPage } from "./pages/task-board";
import { RouterPage } from "./pages/router";
import { DashboardPage } from "./pages/dashboard";
import { NetworkPage } from "./pages/network";
import { IntroPage } from "./pages/intro";
import { MobileStatusPage } from "./pages/mobile-status";
import { LiveViewPage } from "./pages/live-view";
import { MemoryPage } from "./pages/memory";
import { isBBTheme } from "./lib/dashboard-theme";

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

// Layout wrapper with page transitions
function LayoutWithTransitions() {
  const location = useLocation();
  return (
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
  component: IntroPage,
});

// Live view page — standalone, no layout
const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/live",
  component: LiveViewPage,
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

const kanbanRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/kanban",
  component: KanbanPage,
});

const taskBoardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/task-board",
  component: TaskBoardPage,
});

const statusRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/status",
  component: MobileStatusPage,
});

const memoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/memory",
  component: MemoryPage,
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
];

const rootChildren = [
  ...(isBBTheme ? [introRoute, liveRoute] : []),
  layoutRoute.addChildren(layoutChildren),
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
