import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://docs.openspawn.ai",
  integrations: [
    starlight({
      title: "OpenSpawn Docs",
      customCss: ["./src/styles/custom.css"],
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/openspawn/openspawn" }],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", link: "/getting-started/" },
            { label: "Agent Quickstart", link: "/guides/agent-quickstart/" },
            { label: "Templates Guide", link: "/guides/templates/" },
            { label: "Values Framework", link: "/guides/values-framework/" },
            { label: "Comparison", link: "/guides/comparison/" },
            { label: "FAQ", link: "/faq/" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "REST API", link: "/reference/api/" },
            { label: "Org.md Spec", link: "/reference/org-md-spec/" },
            { label: "Communication Protocol", link: "/reference/communication-protocol/" },
            { label: "Agent Communication", link: "/reference/agent-communication-protocol/" },
            { label: "Event-Driven Agents", link: "/reference/event-driven-agents/" },
            { label: "Agent Config Compatibility", link: "/reference/agent-config-compatibility/" },
            { label: "Scenario Engine", link: "/reference/scenario-engine/" },
          ],
        },
        {
          label: "Architecture",
          items: [
            { label: "CEO Agent", link: "/architecture/ceo-agent/" },
            { label: "Integrations", link: "/architecture/integrations/" },
            { label: "Worktree Isolation", link: "/architecture/worktree-isolation/" },
          ],
        },
      ],
    }),
  ],
});
