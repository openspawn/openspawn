import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://openspawn.github.io',
  base: '/openspawn',
  integrations: [
    starlight({
      title: 'BikiniBottom',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/openspawn/openspawn' },
        { icon: 'external', label: 'Live Demo', href: 'https://bikinibottom.ai' },
      ],
      customCss: ['./src/styles/ocean-theme.css'],
      sidebar: [
        { label: 'Getting Started', slug: 'getting-started' },
        {
          label: 'Protocols',
          items: [
            { label: 'Overview', slug: 'protocols/overview' },
            { label: 'A2A Protocol', slug: 'protocols/a2a' },
            { label: 'MCP Tools', slug: 'protocols/mcp' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Model Router', slug: 'features/model-router' },
            { label: 'Agent Hierarchy', slug: 'features/agent-hierarchy' },
            { label: 'Cost Tracking', slug: 'features/cost-tracking' },
            { label: 'Dashboard', slug: 'features/dashboard' },
          ],
        },
        {
          label: 'CLI',
          items: [
            { label: 'Installation', slug: 'cli/installation' },
            { label: 'Commands', slug: 'cli/commands' },
            { label: 'ORG.md Format', slug: 'cli/org-format' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'Overview', slug: 'architecture/overview' },
            { label: 'Agent Communication', slug: 'architecture/acp' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'REST Endpoints', slug: 'api/rest' },
            { label: 'GraphQL', slug: 'api/graphql' },
          ],
        },
      ],
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍍</text></svg>",
          },
        },
      ],
    }),
  ],
});
