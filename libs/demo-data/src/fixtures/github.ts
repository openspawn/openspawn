import type { DemoGitHubConnection, DemoIntegrationLink } from "../types";

export const demoGitHubConnections: DemoGitHubConnection[] = [
  {
    id: "ghc-1",
    name: "acmetech/platform",
    installationId: "48291037",
    repoFilter: ["acmetech/platform", "acmetech/api"],
    enabled: true,
    syncConfig: {
      inbound: {
        createTaskOnIssue: true,
        createTaskOnPR: true,
        createTaskOnCheckFailure: true,
        requiredLabel: "agent-work",
      },
      outbound: {
        closeIssueOnComplete: true,
        commentOnStatusChange: true,
        updateLabels: true,
      },
    },
    lastSyncAt: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: "ghc-2",
    name: "acmetech/docs",
    installationId: "48291038",
    repoFilter: [],
    enabled: true,
    syncConfig: {
      inbound: {
        createTaskOnIssue: true,
        createTaskOnPR: false,
        createTaskOnCheckFailure: false,
      },
      outbound: {
        closeIssueOnComplete: true,
        commentOnStatusChange: false,
        updateLabels: false,
      },
    },
    lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

export const demoIntegrationLinks: DemoIntegrationLink[] = [
  {
    id: "ilink-1",
    provider: "github",
    sourceType: "github_issue",
    sourceId: "142",
    targetType: "task",
    targetId: "task-1",
    metadata: {
      title: "Implement OAuth2 PKCE flow",
      url: "https://github.com/acmetech/platform/issues/142",
      repo: "acmetech/platform",
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "ilink-2",
    provider: "github",
    sourceType: "github_pr",
    sourceId: "287",
    targetType: "task",
    targetId: "task-2",
    metadata: {
      title: "Add rate limiting to API gateway",
      url: "https://github.com/acmetech/platform/pull/287",
      repo: "acmetech/platform",
      author: "bot-reviewer",
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "ilink-3",
    provider: "github",
    sourceType: "github_issue",
    sourceId: "89",
    targetType: "task",
    targetId: "task-3",
    metadata: {
      title: "Update API documentation for v2 endpoints",
      url: "https://github.com/acmetech/docs/issues/89",
      repo: "acmetech/docs",
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
