import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { Layout } from "./components/layout";
import { DashboardPage } from "./pages/dashboard";
import { AgentsPage } from "./pages/agents";
import { TasksPage } from "./pages/tasks";
import { EventsPage } from "./pages/events";
import { MessagesPage } from "./pages/messages";
import { SettingsPage } from "./pages/settings";
import { CreditsPage } from "./pages/credits";
import { TaskBoardPage } from "./pages/task-board";
import { NetworkPage } from "./pages/network";
import { MemoryPage } from "./pages/memory";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>) => ({
    panel: (search.panel as string) || undefined,
    panelId: (search.panelId as string) || undefined,
  }),
});

const agentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/agents",
  component: AgentsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
    panel: (search.panel as string) || undefined,
  }),
});
const tasksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/tasks",
  component: TasksPage,
  validateSearch: (search: Record<string, unknown>) => ({
    panel: (search.panel as string) || undefined,
  }),
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
  validateSearch: (search: Record<string, unknown>) => ({
    channel: (search.channel as string) || undefined,
    dm: (search.dm as string) || undefined,
    thread: (search.thread as string) || undefined,
  }),
});
const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  component: SettingsPage,
});
const creditsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/credits",
  component: CreditsPage,
});
const taskBoardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/task-board",
  component: TaskBoardPage,
  validateSearch: (search: Record<string, unknown>) => ({
    panel: (search.panel as string) || undefined,
  }),
});
const networkRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/network",
  component: NetworkPage,
});

const memoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/memory",
  component: MemoryPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "feed",
    type: (search.type as string) || undefined,
    agent: (search.agent as string) || undefined,
    q: (search.q as string) || undefined,
    page: Number(search.page) || 0,
    node: (search.node as string) || undefined,
  }),
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    agentsRoute,
    tasksRoute,
    eventsRoute,
    messagesRoute,
    settingsRoute,
    creditsRoute,
    taskBoardRoute,
    networkRoute,
    memoryRoute,
  ]),
]);

// VITE_BASE_PATH controls both Vite's `base` and the router basepath.
// team.openspawn.ai sets "/" while bikinibottom.ai embeds at "/app/".
const basepath = (import.meta.env.BASE_URL || "/app/").replace(/\/$/, "") || "/";

export const router = createRouter({ routeTree, basepath });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
