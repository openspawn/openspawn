import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
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
});

const agentsRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/agents", component: AgentsPage });
const tasksRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/tasks", component: TasksPage });
const eventsRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/events", component: EventsPage });
const messagesRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/messages", component: MessagesPage });
const settingsRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/settings", component: SettingsPage });
const creditsRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/credits", component: CreditsPage });
const taskBoardRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/task-board", component: TaskBoardPage });
const networkRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/network", component: NetworkPage });

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
  ]),
]);

export const router = createRouter({ routeTree, basepath: "/app" });

declare module "@tanstack/react-router" {
  interface Register { router: typeof router; }
}
