import type { ReactNode } from "react";
import { DocsLayout as DocsLayoutBase, type SidebarItem, type FlatPage } from "@openspawn/docs-ui";

export { CodeBlock } from "@openspawn/docs-ui";

const sidebar: SidebarItem[] = [
  { label: "⚡ Quick Start (5 min)", to: "/getting-started" },
  { label: "Overview", to: "/docs" },
  { label: "Getting Started", to: "/docs/getting-started" },
  { label: "How It Works", to: "/docs/how-it-works" },
  { label: "OpenClaw Integration", to: "/docs/openclaw" },
  {
    label: "Tutorials",
    children: [{ label: "Your First ORG.md", to: "/docs/tutorials/your-first-org-md" }],
  },
  {
    label: "Guides",
    children: [
      { label: "Connecting Real Agents", to: "/docs/guides/connecting-agents" },
      { label: "Dashboard Guide", to: "/docs/guides/dashboard-guide" },
      { label: "Troubleshooting", to: "/docs/guides/troubleshooting" },
      { label: "Webhooks", to: "/docs/guides/webhooks" },
      { label: "Values Framework", to: "/docs/guides/values-framework" },
    ],
  },
  {
    label: "Concepts",
    children: [{ label: "ACP vs A2A", to: "/docs/concepts/acp-vs-a2a" }],
  },
  {
    label: "Protocols",
    children: [
      { label: "A2A Protocol", to: "/docs/protocols/a2a" },
      { label: "MCP Tools", to: "/docs/protocols/mcp" },
      { label: "MCP Reference", to: "/docs/protocols/mcp-reference" },
    ],
  },
  {
    label: "Features",
    children: [
      { label: "Dashboard", to: "/docs/features/dashboard" },
      { label: "Model Router", to: "/docs/features/model-router" },
    ],
  },
  {
    label: "Agent Guide",
    children: [
      { label: "Agent Quickstart", to: "/docs/agent-quickstart" },
      { label: "Templates Guide", to: "/docs/templates" },
      { label: "Communication Protocol", to: "/docs/communication-protocol" },
    ],
  },
  {
    label: "Reference",
    children: [
      { label: "ORG.md Reference", to: "/docs/reference/org-md-reference" },
      { label: "REST API", to: "/docs/reference/api" },
      { label: "ACP Spec", to: "/docs/reference/acp" },
      { label: "Scenario Engine", to: "/docs/reference/scenario-engine" },
      { label: "Event-Driven Agents", to: "/docs/reference/event-driven-agents" },
      { label: "Agent Config Compat", to: "/docs/reference/agent-config-compat" },
    ],
  },
  {
    label: "Architecture",
    children: [
      { label: "CEO Agent", to: "/docs/architecture/ceo-agent" },
      { label: "Integrations", to: "/docs/architecture/integrations" },
      { label: "Worktree Isolation", to: "/docs/architecture/worktree-isolation" },
    ],
  },
  { label: "FAQ", to: "/docs/faq" },
  { label: "Comparison", to: "/docs/comparison" },
];

const flatPages: FlatPage[] = [
  { label: "Overview", to: "/docs" },
  { label: "Getting Started", to: "/docs/getting-started" },
  { label: "How It Works", to: "/docs/how-it-works" },
  { label: "OpenClaw Integration", to: "/docs/openclaw" },
  { label: "Your First ORG.md", to: "/docs/tutorials/your-first-org-md" },
  { label: "Connecting Real Agents", to: "/docs/guides/connecting-agents" },
  { label: "Dashboard Guide", to: "/docs/guides/dashboard-guide" },
  { label: "Troubleshooting", to: "/docs/guides/troubleshooting" },
  { label: "Webhooks", to: "/docs/guides/webhooks" },
  { label: "Values Framework", to: "/docs/guides/values-framework" },
  { label: "ACP vs A2A", to: "/docs/concepts/acp-vs-a2a" },
  { label: "A2A Protocol", to: "/docs/protocols/a2a" },
  { label: "MCP Tools", to: "/docs/protocols/mcp" },
  { label: "MCP Reference", to: "/docs/protocols/mcp-reference" },
  { label: "Dashboard", to: "/docs/features/dashboard" },
  { label: "Model Router", to: "/docs/features/model-router" },
  { label: "Agent Quickstart", to: "/docs/agent-quickstart" },
  { label: "Templates Guide", to: "/docs/templates" },
  { label: "Communication Protocol", to: "/docs/communication-protocol" },
  { label: "ORG.md Reference", to: "/docs/reference/org-md-reference" },
  { label: "REST API", to: "/docs/reference/api" },
  { label: "ACP Spec", to: "/docs/reference/acp" },
  { label: "Scenario Engine", to: "/docs/reference/scenario-engine" },
  { label: "Event-Driven Agents", to: "/docs/reference/event-driven-agents" },
  { label: "Agent Config Compat", to: "/docs/reference/agent-config-compat" },
  { label: "CEO Agent", to: "/docs/architecture/ceo-agent" },
  { label: "Integrations", to: "/docs/architecture/integrations" },
  { label: "Worktree Isolation", to: "/docs/architecture/worktree-isolation" },
  { label: "FAQ", to: "/docs/faq" },
  { label: "Comparison", to: "/docs/comparison" },
];

export function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayoutBase sidebar={sidebar} flatPages={flatPages}>
      {children}
    </DocsLayoutBase>
  );
}
