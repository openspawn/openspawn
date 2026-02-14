import { createRootRoute, createRoute } from "@tanstack/react-router";
import { RootLayout } from "./routes/__root";
import { LandingPage } from "./routes/index";
import { DocsIndex } from "./routes/docs/index";
import { GettingStarted } from "./routes/docs/getting-started";
import { A2AProtocol } from "./routes/docs/protocols/a2a";
import { MCPTools } from "./routes/docs/protocols/mcp";
import { DashboardDocs } from "./routes/docs/features/dashboard";
import { ModelRouterDocs } from "./routes/docs/features/model-router";
import { OrgMdPage } from "./routes/org-md";

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
});

const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/",
  component: DocsIndex,
});

const gettingStartedRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/getting-started",
  component: GettingStarted,
});

const a2aRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/protocols/a2a",
  component: A2AProtocol,
});

const mcpRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/protocols/mcp",
  component: MCPTools,
});

const dashboardRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/features/dashboard",
  component: DashboardDocs,
});

const modelRouterRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/features/model-router",
  component: ModelRouterDocs,
});

const docsRouteTree = docsRoute.addChildren([
  docsIndexRoute,
  gettingStartedRoute,
  a2aRoute,
  mcpRoute,
  dashboardRoute,
  modelRouterRoute,
]);

const orgMdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/org-md",
  component: OrgMdPage,
});

export const routeTree = rootRoute.addChildren([indexRoute, orgMdRoute, docsRouteTree]);
