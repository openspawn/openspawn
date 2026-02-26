import { createRootRoute, createRoute, createNotFoundRoute } from "@tanstack/react-router";
import { RootLayout } from "./routes/__root";
import { LandingPage } from "./routes/index";
import { DocsIndex } from "./routes/docs/index";
import { GettingStarted } from "./routes/docs/getting-started";
import { YourFirstOrgMd } from "./routes/docs/tutorials/your-first-org-md";
import { A2AProtocol } from "./routes/docs/protocols/a2a";
import { MCPTools } from "./routes/docs/protocols/mcp";
import { DashboardDocs } from "./routes/docs/features/dashboard";
import { ModelRouterDocs } from "./routes/docs/features/model-router";
import { OrgMdPage } from "./routes/org-md";
import { TemplatesPage } from "./routes/templates";
import { OpenClawQuickstart } from "./routes/docs/openclaw-quickstart";
import { HowItWorks } from "./routes/docs/how-it-works";
import { ConnectingAgents } from "./routes/docs/guides/connecting-agents";
import { DashboardGuide } from "./routes/docs/guides/dashboard-guide";
import { AcpVsA2A } from "./routes/docs/concepts/acp-vs-a2a";
import { ComparisonPage } from "./routes/docs/comparison";
import { MCPReference } from "./routes/docs/protocols/mcp-reference";
import { OrgMdReference } from "./routes/docs/reference/org-md-reference";
import { AgentQuickstart } from "./routes/docs/agent-quickstart";
import { TemplatesGuide } from "./routes/docs/templates";
import { CommunicationProtocol } from "./routes/docs/communication-protocol";
import { NotFoundPage } from "./routes/not-found";

// ─── Shared OG image ──────────────────────────────────────────────────────────
const OG_IMAGE = "https://openspawn.dev/og-image.jpg";
const SITE_NAME = "OpenSpawn";
const TWITTER_SITE = "@openspawn";
const BASE_URL = "https://openspawn.dev";

// ─── Helper to build full meta array ─────────────────────────────────────────
// TanStack Router meta() supports: { title }, { name, content }, { property, content },
// and { "script:ld+json": {} }. Canonical <link> tags are handled by the CanonicalTag
// component in page layouts (React 19 hoists <link> to <head> automatically).
function buildMeta(opts: {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  schemaLd?: object;
}) {
  const { title, description, path, ogTitle, schemaLd } = opts;
  const ogTitleVal = ogTitle ?? title;
  const url = `${BASE_URL}${path}`;

  const tags: Array<Record<string, unknown>> = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index, follow" },
    // Open Graph
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: ogTitleVal },
    { property: "og:description", content: description },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:url", content: url },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_SITE },
    { name: "twitter:title", content: ogTitleVal },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE },
  ];

  if (schemaLd) {
    tags.push({ "script:ld+json": schemaLd });
  }

  return tags;
}

// ─── JSON-LD Schemas ──────────────────────────────────────────────────────────

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "OpenSpawn",
  url: BASE_URL,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Linux, macOS, Windows",
  description:
    "Multi-agent orchestration platform. Define AI agent organizations in a markdown file, deploy with npx openspawn init.",
  offers: {
    "@type": "Offer",
    price: "0.00",
    priceCurrency: "USD",
  },
  license: "https://opensource.org/licenses/MIT",
  softwareVersion: "0.3",
  programmingLanguage: ["TypeScript", "Python"],
  author: {
    "@type": "Organization",
    name: "OpenSpawn",
  },
};

const gettingStartedHowToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Set Up a Multi-Agent AI Organization with OpenSpawn",
  description: "Scaffold your first agent org and send it a task in under 10 minutes.",
  totalTime: "PT10M",
  tool: [
    { "@type": "HowToTool", name: "Node.js 18+" },
    { "@type": "HowToTool", name: "npx" },
  ],
  step: [
    {
      "@type": "HowToStep",
      name: "Scaffold Your Org",
      text: "Run npx openspawn init my-org to create your ORG.md and config file.",
      url: `${BASE_URL}/docs/getting-started#step-1`,
    },
    {
      "@type": "HowToStep",
      name: "Start the Server",
      text: "Run npx openspawn start to launch the server and dashboard.",
      url: `${BASE_URL}/docs/getting-started#step-2`,
    },
    {
      "@type": "HowToStep",
      name: "Open the Dashboard",
      text: "Navigate to http://localhost:3333 to see your live agent org.",
      url: `${BASE_URL}/docs/getting-started#step-3`,
    },
    {
      "@type": "HowToStep",
      name: "Send Your First Task",
      text: "Use the dashboard or CLI to send a task to your org and watch agents coordinate.",
      url: `${BASE_URL}/docs/getting-started#step-4`,
    },
    {
      "@type": "HowToStep",
      name: "Edit Your ORG.md",
      text: "Open ORG.md and customize your agent hierarchy, roles, and policies.",
      url: `${BASE_URL}/docs/getting-started#step-5`,
    },
    {
      "@type": "HowToStep",
      name: "Apply Changes",
      text: "Run npx openspawn apply to reload your org from the updated ORG.md.",
      url: `${BASE_URL}/docs/getting-started#step-6`,
    },
    {
      "@type": "HowToStep",
      name: "Configure Model Providers",
      text: "Add Ollama, Groq, or OpenRouter API keys to openspawn.config.json for real LLM inference.",
      url: `${BASE_URL}/docs/getting-started#step-7`,
    },
    {
      "@type": "HowToStep",
      name: "Connect External Agents",
      text: "Add LLM-powered agents via ACP or A2A protocol to connect your existing agent infrastructure.",
      url: `${BASE_URL}/docs/getting-started#step-8`,
    },
  ],
};

const howItWorksFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is OpenSpawn?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenSpawn is a platform for building and running organizations made of AI agents. You describe your org in a single markdown file (ORG.md) and OpenSpawn reads it, spins up a live simulation, and your agents start working.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Agent Communication Protocol (ACP)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ACP is OpenSpawn's internal protocol for agent communication. It defines four message types: Acknowledgment (ACK), Progress Updates, Escalation, and Completion — modeled on how effective human organizations communicate.",
      },
    },
    {
      "@type": "Question",
      name: "How does OpenSpawn connect to real-world devices?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenSpawn uses 'nodes' — paired real-world devices like phones, cameras, laptops, and IoT sensors. Agents can take photos, read screens, get GPS, push notifications, and run commands on paired devices.",
      },
    },
  ],
};

function docBreadcrumb(items: Array<{ name: string; href: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "OpenSpawn", item: BASE_URL },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: `${BASE_URL}${item.href}`,
      })),
    ],
  };
}

// ─── Root route ───────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

// ─── Landing page ─────────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
  meta: () =>
    buildMeta({
      title: "OpenSpawn — Multi-Agent Orchestration Platform",
      description:
        "Build and run organizations of AI agents that control real devices, phones, and IoT. Open source, TypeScript-first, zero config. npx openspawn init my-org.",
      path: "/",
      schemaLd: softwareApplicationSchema,
    }),
});

// ─── Docs parent ─────────────────────────────────────────────────────────────
const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
});

const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/",
  component: DocsIndex,
  meta: () =>
    buildMeta({
      title: "Documentation — OpenSpawn",
      description:
        "Complete documentation for OpenSpawn: getting started guides, ORG.md tutorials, protocol references, and integration guides for multi-agent AI organizations.",
      path: "/docs",
      schemaLd: docBreadcrumb([{ name: "Docs", href: "/docs" }]),
    }),
});

const gettingStartedRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/getting-started",
  component: GettingStarted,
  meta: () =>
    buildMeta({
      title: "Getting Started with OpenSpawn — Multi-Agent Setup in 10 Minutes",
      description:
        "Scaffold a multi-agent AI org, send it a task, and watch agents coordinate in real time — in under 10 minutes. Step-by-step guide with code examples.",
      path: "/docs/getting-started",
      schemaLd: gettingStartedHowToSchema,
    }),
});

const howItWorksRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/how-it-works",
  component: HowItWorks,
  meta: () =>
    buildMeta({
      title: "How OpenSpawn Works — AI Agent Orchestration Explained",
      description:
        "OpenSpawn runs AI agent organizations defined in a single markdown file (ORG.md). Learn how agent hierarchies, ACP communication, and device nodes work together.",
      path: "/docs/how-it-works",
      schemaLd: howItWorksFaqSchema,
    }),
});

const openclawQuickstartRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/openclaw",
  component: OpenClawQuickstart,
  meta: () =>
    buildMeta({
      title: "OpenClaw Quickstart — OpenSpawn Integration Guide",
      description:
        "Connect OpenSpawn to OpenClaw agents. Add multi-agent org structure to your existing OpenClaw deployment with zero extra config.",
      path: "/docs/openclaw",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "OpenClaw Quickstart", href: "/docs/openclaw" },
      ]),
    }),
});

const yourFirstOrgMdRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/tutorials/your-first-org-md",
  component: YourFirstOrgMd,
  meta: () =>
    buildMeta({
      title: "Build Your First AI Agent Org — ORG.md Tutorial",
      description:
        "Full tutorial: build a production-ready agent org from 3 agents to full departments, culture settings, policies, and playbooks — all in plain markdown.",
      path: "/docs/tutorials/your-first-org-md",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Tutorials", href: "/docs/tutorials/your-first-org-md" },
        { name: "Your First ORG.md", href: "/docs/tutorials/your-first-org-md" },
      ]),
    }),
});

const connectingAgentsRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/guides/connecting-agents",
  component: ConnectingAgents,
  meta: () =>
    buildMeta({
      title: "Connect LLM Agents to OpenSpawn — Configuration Guide",
      description:
        "Add LLM-powered agents to your OpenSpawn org. Configure models (Claude, GPT-4, Ollama), capabilities, and role descriptions. Includes ACP walkthrough and troubleshooting.",
      path: "/docs/guides/connecting-agents",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Guides", href: "/docs/guides/connecting-agents" },
        { name: "Connecting Agents", href: "/docs/guides/connecting-agents" },
      ]),
    }),
});

const dashboardGuideRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/guides/dashboard-guide",
  component: DashboardGuide,
  meta: () =>
    buildMeta({
      title: "OpenSpawn Dashboard Guide — Monitor Your AI Agent Org",
      description:
        "Monitor your AI agent org in real time. Network graph, task timeline, escalation alerts, credit tracking, and debugging workflows — complete dashboard reference.",
      path: "/docs/guides/dashboard-guide",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Guides", href: "/docs/guides/dashboard-guide" },
        { name: "Dashboard Guide", href: "/docs/guides/dashboard-guide" },
      ]),
    }),
});

const acpVsA2ARoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/concepts/acp-vs-a2a",
  component: AcpVsA2A,
  meta: () =>
    buildMeta({
      title: "ACP vs A2A — Two Protocols, Two Jobs — OpenSpawn",
      description:
        "Understand the difference between ACP (internal agent communication) and A2A (cross-org agent protocol). When to use each in your OpenSpawn deployment.",
      path: "/docs/concepts/acp-vs-a2a",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Concepts", href: "/docs/concepts/acp-vs-a2a" },
        { name: "ACP vs A2A", href: "/docs/concepts/acp-vs-a2a" },
      ]),
    }),
});

const a2aRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/protocols/a2a",
  component: A2AProtocol,
  meta: () =>
    buildMeta({
      title: "Agent-to-Agent (A2A) Protocol — OpenSpawn",
      description:
        "OpenSpawn implements Google's Agent-to-Agent (A2A) protocol v0.3. Discover agents, send tasks, stream results, and connect any A2A-compatible agent or framework.",
      path: "/docs/protocols/a2a",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Protocols", href: "/docs/protocols/a2a" },
        { name: "A2A Protocol", href: "/docs/protocols/a2a" },
      ]),
    }),
});

const mcpRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/protocols/mcp",
  component: MCPTools,
  meta: () =>
    buildMeta({
      title: "OpenSpawn as an MCP Tools Server — Claude Desktop & Cursor Integration",
      description:
        "Connect your OpenSpawn org to Claude Desktop, Cursor, or any MCP client. 7 tools via Streamable HTTP — delegate tasks, list agents, and monitor your org.",
      path: "/docs/protocols/mcp",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Protocols", href: "/docs/protocols/mcp" },
        { name: "MCP Tools", href: "/docs/protocols/mcp" },
      ]),
    }),
});

const dashboardRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/features/dashboard",
  component: DashboardDocs,
  meta: () =>
    buildMeta({
      title: "OpenSpawn Dashboard — Live Agent Monitoring",
      description:
        "The OpenSpawn dashboard gives you a real-time view of your agent org: network graph, task timelines, cost tracking, and escalation chains.",
      path: "/docs/features/dashboard",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Features", href: "/docs/features/dashboard" },
        { name: "Dashboard", href: "/docs/features/dashboard" },
      ]),
    }),
});

const modelRouterRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/features/model-router",
  component: ModelRouterDocs,
  meta: () =>
    buildMeta({
      title: "OpenSpawn Model Router — Automatic LLM Routing for Agent Orgs",
      description:
        "Route to the right model automatically. Local-first with Ollama, cloud when needed. Fallback chains and per-task cost tracking. Reduce LLM costs up to 78%.",
      path: "/docs/features/model-router",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Features", href: "/docs/features/model-router" },
        { name: "Model Router", href: "/docs/features/model-router" },
      ]),
    }),
});

const comparisonRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/comparison",
  component: ComparisonPage,
  meta: () =>
    buildMeta({
      title: "OpenSpawn vs CrewAI vs LangGraph — Multi-Agent Framework Comparison (2026)",
      description:
        "Compare OpenSpawn, CrewAI, and LangGraph side-by-side. Feature tables, honest tradeoffs, and migration guides for switching between multi-agent frameworks.",
      path: "/docs/comparison",
      ogTitle: "OpenSpawn vs CrewAI vs LangGraph",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Comparison", href: "/docs/comparison" },
      ]),
    }),
});

const mcpReferenceRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/protocols/mcp-reference",
  component: MCPReference,
  meta: () =>
    buildMeta({
      title: "MCP Tools & Integrations — OpenSpawn Model Context Protocol Reference",
      description:
        "Complete reference for OpenSpawn's MCP server. Connect Claude Desktop, Cursor, CrewAI, LangGraph, or any MCP client to your agent org via 7 tools over Streamable HTTP.",
      path: "/docs/protocols/mcp-reference",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Protocols", href: "/docs/protocols/mcp-reference" },
        { name: "MCP Reference", href: "/docs/protocols/mcp-reference" },
      ]),
    }),
});

const orgMdReferenceRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/reference/org-md-reference",
  component: OrgMdReference,
  meta: () =>
    buildMeta({
      title: "ORG.md Reference — OpenSpawn Configuration Specification",
      description:
        "Complete reference for ORG.md, the OpenSpawn organization definition format. Every field, section, value, and example — plus copy-pasteable snippets for common configurations.",
      path: "/docs/reference/org-md-reference",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Reference", href: "/docs/reference/org-md-reference" },
        { name: "ORG.md Reference", href: "/docs/reference/org-md-reference" },
      ]),
    }),
});

const agentQuickstartRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/agent-quickstart",
  component: AgentQuickstart,
  meta: () =>
    buildMeta({
      title: "Agent Quickstart — OpenSpawn",
      description:
        "Get an AI agent from zero to a running multi-agent organization in 10 minutes. Step-by-step guide for AI agents that need to coordinate other agents.",
      path: "/docs/agent-quickstart",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Agent Guide", href: "/docs/agent-quickstart" },
        { name: "Agent Quickstart", href: "/docs/agent-quickstart" },
      ]),
    }),
});

const templatesGuideRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/templates",
  component: TemplatesGuide,
  meta: () =>
    buildMeta({
      title: "Templates Guide — OpenSpawn Org Templates",
      description:
        "Choose and customize OpenSpawn org templates. Compare assistant-team, content-agency, dev-shop, and research-lab with decision trees and role breakdowns.",
      path: "/docs/templates",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Agent Guide", href: "/docs/agent-quickstart" },
        { name: "Templates Guide", href: "/docs/templates" },
      ]),
    }),
});

const communicationProtocolRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/communication-protocol",
  component: CommunicationProtocol,
  meta: () =>
    buildMeta({
      title: "Communication Protocol — OpenSpawn",
      description:
        "The OpenSpawn Communication Protocol eliminates 40-60% of wasted tokens in multi-agent organizations. Four message types, decision trees, and anti-patterns.",
      path: "/docs/communication-protocol",
      schemaLd: docBreadcrumb([
        { name: "Docs", href: "/docs" },
        { name: "Agent Guide", href: "/docs/agent-quickstart" },
        { name: "Communication Protocol", href: "/docs/communication-protocol" },
      ]),
    }),
});

const docsRouteTree = docsRoute.addChildren([
  docsIndexRoute,
  gettingStartedRoute,
  howItWorksRoute,
  openclawQuickstartRoute,
  yourFirstOrgMdRoute,
  connectingAgentsRoute,
  dashboardGuideRoute,
  acpVsA2ARoute,
  a2aRoute,
  mcpRoute,
  mcpReferenceRoute,
  dashboardRoute,
  modelRouterRoute,
  comparisonRoute,
  orgMdReferenceRoute,
  agentQuickstartRoute,
  templatesGuideRoute,
  communicationProtocolRoute,
]);

const orgMdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/org-md",
  component: OrgMdPage,
  meta: () =>
    buildMeta({
      title: "ORG.md — Define Your AI Agent Organization in Markdown",
      description:
        "ORG.md is the configuration file that defines your entire AI agent organization: mission, structure, culture, policies, and playbooks — version-controlled and diffable.",
      path: "/org-md",
    }),
});

const templatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/templates",
  component: TemplatesPage,
  meta: () =>
    buildMeta({
      title: "AI Agent Org Templates — ORG.md Starter Kits",
      description:
        "Ready-made ORG.md configurations for startups, dev teams, marketing agencies, support orgs, and research labs. Copy, paste, and spawn your team instantly.",
      path: "/templates",
    }),
});

export const routeTree = rootRoute.addChildren([indexRoute, orgMdRoute, templatesRoute, docsRouteTree]);
