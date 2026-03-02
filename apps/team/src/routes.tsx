import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Navigate,
} from "@tanstack/react-router";
import { Layout } from "./components/layout";
import { useAuth } from "./contexts";
import { DashboardPage } from "./pages/dashboard";
import { AgentsPage } from "./pages/agents";
import { TasksPage } from "./pages/tasks";
import { EventsPage } from "./pages/events";
import { MessagesPage } from "./pages/messages";
import { SettingsPage } from "./pages/settings";
import { CreditsPage } from "./pages/credits";
import { KanbanPage } from "./pages/kanban";
import { TaskBoardPage } from "./pages/task-board";
import { NetworkPage } from "./pages/network";
import { LoginPage } from "./pages/login";
import { AuthCallbackPage } from "./pages/auth-callback";
import type { ReactNode } from "react";

// Protected route wrapper — redirects to /login if not authenticated
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center text-white/40">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Auth routes — standalone, no layout
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

// Layout route for all protected pages
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: () => (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  ),
});

// Child routes
const indexRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/", component: DashboardPage });
const tasksRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/tasks", component: TasksPage });
const agentsRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/agents", component: AgentsPage });
const creditsRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/credits", component: CreditsPage });
const eventsRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/events", component: EventsPage });
const messagesRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/messages", component: MessagesPage });
const networkRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/network", component: NetworkPage });
const settingsRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/settings", component: SettingsPage });
const kanbanRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/kanban", component: KanbanPage });
const taskBoardRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/task-board", component: TaskBoardPage });

const routeTree = rootRoute.addChildren([
  loginRoute,
  authCallbackRoute,
  layoutRoute.addChildren([
    indexRoute,
    tasksRoute,
    agentsRoute,
    creditsRoute,
    eventsRoute,
    messagesRoute,
    networkRoute,
    settingsRoute,
    kanbanRoute,
    taskBoardRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  basepath: "/app",
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
