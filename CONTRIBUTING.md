# Contributing to OpenSpawn

Welcome to OpenSpawn! We are building the coordination layer for AI agent organizations.

## Quick Links

- **GitHub:** https://github.com/openspawn/openspawn
- **Vision:** VISION.md
- **Website:** https://openspawn.ai
- **Live Demo:** https://bikinibottom.ai

## How to Contribute

1. **Bugs and small fixes** — Open a PR
2. **New features or architecture changes** — Start a GitHub Discussion or Issue first
3. **Org templates** — Submit new industry templates via PR
4. **Documentation** — Always welcome

## Before You PR

- Test locally: `pnpm install && pnpm test`
- Ensure builds pass: `pnpm nx run-many -t build`
- Keep PRs focused (one topic per PR)
- Describe what and why in the PR description

## Project Structure

```
apps/
  demo/          # bikinibottom.ai — live demo dashboard
  team/          # team.openspawn.ai — internal team dashboard
  website/       # openspawn.ai — marketing site + docs
  api/           # api.openspawn.ai — NestJS GraphQL + REST API
  docs/          # Astro Starlight documentation site
libs/
  dashboard-ui/  # Shared React UI components
  dashboard-data/ # Shared data fetching and state
  design-tokens/ # Design system tokens (colors, spacing, typography)
  database/      # TypeORM entities and database utilities
  test-utils/    # Shared test utilities
tools/
  sandbox/       # Coordination sandbox server (SSE + MCP + A2A)
packages/
  openspawn/     # CLI package (npx openspawn init)
```

## Development Setup

```bash
git clone https://github.com/openspawn/openspawn.git
cd openspawn
pnpm install
pnpm test
```

## AI-Assisted PRs Welcome

Built with Claude, Codex, Cursor, or other AI tools? Great — just be transparent:

- Mark as AI-assisted in the PR title or description
- Note the degree of testing (untested / lightly tested / fully tested)
- Confirm you understand what the code does
- Include prompts or session logs if helpful

AI PRs are first-class citizens. We just want transparency so reviewers know what to look for.

## Org Templates

We ship industry-specific org templates. To contribute a new template:

1. Create a new directory under `tools/sandbox/org/`
2. Write the ORG.md for your industry use case
3. Include realistic agent roles, policies, and playbooks
4. Add a brief README explaining the scenario
5. Open a PR with the template name in the title

## Code Style

- TypeScript throughout
- ESLint + Prettier for formatting
- Vitest for testing
- Co-locate tests with source files when possible

## Reporting Security Issues

See SECURITY.md for our security policy and responsible disclosure process.
