import { Command } from "commander";
import pc from "picocolors";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { icons } from "../lib/output.js";

const STARTER_ORG = `# My Organization

## Identity
A small, fast-moving team of AI agents. We ship things.
- **Industry:** Technology
- **Stage:** Early

## Culture
preset: startup

## Structure

### COO
The operational lead. Receives tasks, delegates to department leads, ensures nothing falls through the cracks.
- **Level:** 9
- **Model:** claude-sonnet
- **Domain:** operations

### Engineering
#### Engineering Lead
Triages technical work. Breaks projects into tasks. Delegates to workers.
- **Level:** 7
- **Model:** claude-sonnet
- **Domain:** engineering

#### Workers
Write code, run tests, build APIs. The hands on keyboards.
- **Level:** 5
- **Model:** claude-haiku
- **Domain:** engineering
- **Pool:** 3

### Research
#### Research Lead
Investigates solutions, evaluates options, writes recommendations.
- **Level:** 7
- **Model:** claude-sonnet
- **Domain:** research

## Policies
- Budget approval required above 1000 credits
- Escalation required for cross-department dependencies
- All production deploys need COO sign-off

## Playbooks
### New Feature Request
1. Research Lead evaluates feasibility
2. Engineering Lead creates task breakdown
3. Workers implement and test
4. COO reviews and approves deploy
`;

const README_CONTENT = `# My OpenSpawn Organization

This directory contains your agent organization definition.

## Quick Start

\`\`\`bash
# Preview your org (local sandbox)
npx openspawn preview

# See your agents
npx openspawn agents list --demo
\`\`\`

## Files

- \`ORG.md\` — Your organization definition (roles, hierarchy, policies)
- \`README.md\` — This file

## Learn More

- [Getting Started](https://openspawn.ai/docs/getting-started)
- [ORG.md Reference](https://openspawn.ai/docs/reference/org-md-reference)
- [How It Works](https://openspawn.ai/docs/how-it-works)
- [Live Demo](https://bikinibottom.ai)
`;

export function createInitCommand(): Command {
  const cmd = new Command("init");

  cmd
    .description("Scaffold a new OpenSpawn organization")
    .argument("[name]", "Organization directory name", "my-org")
    .option("--template <template>", "Use an industry template (startup, agency, devops)")
    .option("--force", "Overwrite existing directory")
    .action(async (name: string, opts: { template?: string; force?: boolean }) => {
      const targetDir = join(process.cwd(), name);

      console.log("");
      console.log(
        `${icons.rocket} ${pc.bold("Creating OpenSpawn organization:")} ${pc.cyan(name)}`,
      );
      console.log("");

      // Check if directory exists
      if (existsSync(targetDir) && !opts.force) {
        console.log(
          `${icons.error} Directory ${pc.bold(name)} already exists. Use ${pc.dim("--force")} to overwrite.`,
        );
        process.exit(1);
      }

      // Create directory
      mkdirSync(targetDir, { recursive: true });

      // Write ORG.md
      const orgContent = getOrgTemplate(opts.template);
      writeFileSync(join(targetDir, "ORG.md"), orgContent);
      console.log(`  ${icons.check} ${pc.dim("ORG.md")} — Organization definition`);

      // Write README
      writeFileSync(join(targetDir, "README.md"), README_CONTENT);
      console.log(`  ${icons.check} ${pc.dim("README.md")} — Getting started guide`);

      console.log("");
      console.log(`${icons.check} ${pc.green("Organization created!")}`);
      console.log("");
      console.log(`  ${pc.dim("Next steps:")}`);
      console.log(`  ${pc.cyan(`cd ${name}`)}`);
      console.log(`  ${pc.cyan("npx openspawn preview")}  ${pc.dim("# launch the sandbox")}`);
      console.log(`  ${pc.dim("Edit ORG.md to customize your organization")}`);
      console.log("");
      console.log(`  ${pc.dim("Docs:")} ${pc.cyan("https://openspawn.ai/docs/getting-started")}`);
      console.log("");
    });

  return cmd;
}

function getOrgTemplate(template?: string): string {
  if (!template || template === "startup") {
    return STARTER_ORG;
  }

  const templates: Record<string, string> = {
    agency: `# Creative Agency

## Identity
A creative agency with specialized teams for different client needs.
- **Industry:** Creative Services
- **Stage:** Growth

## Culture
preset: creative

## Structure

### Creative Director
Oversees all creative output. Final approval on deliverables.
- **Level:** 9
- **Model:** claude-sonnet
- **Domain:** creative

### Design
#### Design Lead
Manages design projects and brand consistency.
- **Level:** 7
- **Model:** claude-sonnet
- **Domain:** design

#### Designers
Create visual assets, layouts, and prototypes.
- **Level:** 5
- **Model:** claude-haiku
- **Domain:** design
- **Pool:** 3

### Content
#### Content Lead
Plans content strategy and editorial calendar.
- **Level:** 7
- **Model:** claude-sonnet
- **Domain:** content

#### Writers
Write copy, blog posts, social media content.
- **Level:** 5
- **Model:** claude-haiku
- **Domain:** content
- **Pool:** 2

## Policies
- Client deliverables require Creative Director sign-off
- Brand guidelines must be followed for all visual work
`,

    devops: `# DevOps Team

## Identity
An infrastructure and operations team managing cloud deployments.
- **Industry:** Technology
- **Stage:** Scaling

## Culture
preset: ops

## Structure

### SRE Lead
Site reliability engineering lead. Owns uptime and incident response.
- **Level:** 9
- **Model:** claude-sonnet
- **Domain:** infrastructure

### Platform
#### Platform Lead
Manages CI/CD, infrastructure as code, and developer tooling.
- **Level:** 7
- **Model:** claude-sonnet
- **Domain:** platform

#### Platform Engineers
Build and maintain deployment pipelines, monitoring, and infra.
- **Level:** 5
- **Model:** claude-haiku
- **Domain:** platform
- **Pool:** 3

### Security
#### Security Lead
Manages vulnerability scanning, access control, and compliance.
- **Level:** 7
- **Model:** claude-sonnet
- **Domain:** security

## Policies
- All infrastructure changes require peer review
- Incident response: acknowledge within 5 minutes
- Security patches: deploy within 24 hours
`,
  };

  if (templates[template]) {
    return templates[template];
  }

  console.log(
    `${icons.warning} Unknown template "${template}". Available: startup, agency, devops`,
  );
  console.log(`  Using default (startup) template.`);
  return STARTER_ORG;
}
