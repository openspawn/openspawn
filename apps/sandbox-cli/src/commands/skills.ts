import { Command } from "commander";
import pc from "picocolors";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  cpSync,
  readdirSync,
  statSync,
} from "fs";
import { join, basename, resolve } from "path";
import { execSync } from "child_process";
import { icons } from "../lib/output.js";

interface SkillFrontmatter {
  name?: string;
  version?: string;
  description?: string;
  "allowed-tools"?: string[];
  "benefits-from"?: string[];
}

function parseFrontmatter(content: string): {
  frontmatter: SkillFrontmatter;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const fm: SkillFrontmatter = {};
  const lines = match[1].split("\n");
  let currentKey = "";
  let inArray = false;
  const arrayValues: string[] = [];

  for (const line of lines) {
    if (line.match(/^(\w[\w-]*):\s*$/)) {
      if (inArray && currentKey) {
        (fm as Record<string, unknown>)[currentKey] = [...arrayValues];
        arrayValues.length = 0;
      }
      currentKey = line.match(/^(\w[\w-]*):/)?.[1] || "";
      inArray = false;
    } else if (line.match(/^(\w[\w-]*):\s*\[(.+)\]\s*$/)) {
      const m = line.match(/^(\w[\w-]*):\s*\[(.+)\]\s*$/);
      if (m) {
        (fm as Record<string, unknown>)[m[1]] = m[2].split(",").map((s) => s.trim());
      }
    } else if (line.match(/^(\w[\w-]*):\s*\|?\s*$/)) {
      if (inArray && currentKey) {
        (fm as Record<string, unknown>)[currentKey] = [...arrayValues];
        arrayValues.length = 0;
      }
      currentKey = line.match(/^(\w[\w-]*):/)?.[1] || "";
      inArray = false;
    } else if (line.match(/^(\w[\w-]*):\s+(.+)$/)) {
      if (inArray && currentKey) {
        (fm as Record<string, unknown>)[currentKey] = [...arrayValues];
        arrayValues.length = 0;
        inArray = false;
      }
      const m = line.match(/^(\w[\w-]*):\s+(.+)$/);
      if (m) {
        (fm as Record<string, unknown>)[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } else if (line.match(/^\s+-\s+(.+)$/)) {
      inArray = true;
      const val = line.match(/^\s+-\s+(.+)$/)?.[1] || "";
      arrayValues.push(val);
    } else if (line.match(/^\s+/) && currentKey) {
      // Multi-line value continuation
      const existing = (fm as Record<string, unknown>)[currentKey];
      if (typeof existing === "string") {
        (fm as Record<string, unknown>)[currentKey] = existing + " " + line.trim();
      }
    }
  }

  if (inArray && currentKey) {
    (fm as Record<string, unknown>)[currentKey] = [...arrayValues];
  }

  return { frontmatter: fm, body: match[2] };
}

function validateSkillDir(dirPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const skillPath = join(dirPath, "SKILL.md");

  if (!existsSync(skillPath)) {
    errors.push("Missing SKILL.md file");
    return { valid: false, errors };
  }

  const content = readFileSync(skillPath, "utf-8");
  const { frontmatter } = parseFrontmatter(content);

  if (!frontmatter.name) {
    errors.push("Missing 'name' in frontmatter");
  }
  if (!frontmatter.description) {
    errors.push("Missing 'description' in frontmatter");
  }

  return { valid: errors.length === 0, errors };
}

export function createSkillsCommand(): Command {
  const cmd = new Command("skills");
  cmd.description("Manage agent skills (import, export, list, validate)");

  // --- skills list ---
  cmd
    .command("list")
    .description("List available skills")
    .action(() => {
      const skillsDir = join(process.cwd(), "skills");
      if (!existsSync(skillsDir)) {
        console.log(`\n${icons.warning} No skills directory found at ${pc.dim(skillsDir)}`);
        console.log(pc.dim("  Run: openspawn skills import <source> to add skills\n"));
        return;
      }

      const entries = readdirSync(skillsDir).filter((e) => {
        const p = join(skillsDir, e);
        return statSync(p).isDirectory() && existsSync(join(p, "SKILL.md"));
      });

      if (entries.length === 0) {
        console.log(`\n${icons.warning} No skills found in ${pc.dim(skillsDir)}\n`);
        return;
      }

      console.log(`\n${pc.bold("Available Skills:")}\n`);
      for (const entry of entries) {
        const content = readFileSync(join(skillsDir, entry, "SKILL.md"), "utf-8");
        const { frontmatter } = parseFrontmatter(content);
        const name = frontmatter.name || entry;
        const version = frontmatter.version || "unknown";
        const desc = frontmatter.description
          ? frontmatter.description.split("\n")[0].trim().slice(0, 60)
          : "(no description)";

        console.log(
          `  ${icons.check} ${pc.cyan(name)} ${pc.dim(`v${version}`)} — ${pc.dim(desc)}`,
        );
      }
      console.log("");
    });

  // --- skills validate ---
  cmd
    .command("validate")
    .description("Validate a skill directory")
    .argument("<path>", "Path to skill directory")
    .action((skillPath: string) => {
      const resolved = resolve(skillPath);
      console.log(`\n${pc.bold("Validating skill:")} ${pc.cyan(resolved)}\n`);

      const { valid, errors } = validateSkillDir(resolved);

      if (valid) {
        const content = readFileSync(join(resolved, "SKILL.md"), "utf-8");
        const { frontmatter } = parseFrontmatter(content);
        console.log(`  ${icons.check} ${pc.green("Valid skill")}`);
        console.log(`  ${pc.dim("Name:")} ${frontmatter.name}`);
        console.log(`  ${pc.dim("Version:")} ${frontmatter.version || "not set"}`);
        console.log(`  ${pc.dim("Description:")} ${frontmatter.description?.split("\n")[0].trim() || "not set"}`);
        if (frontmatter["allowed-tools"]) {
          console.log(
            `  ${pc.dim("Allowed tools:")} ${(frontmatter["allowed-tools"] as string[]).join(", ")}`,
          );
        }
        if (frontmatter["benefits-from"]) {
          console.log(
            `  ${pc.dim("Benefits from:")} ${(frontmatter["benefits-from"] as string[]).join(", ")}`,
          );
        }
      } else {
        console.log(`  ${icons.error} ${pc.red("Invalid skill")}`);
        for (const err of errors) {
          console.log(`    ${pc.yellow("•")} ${err}`);
        }
      }
      console.log("");
    });

  // --- skills import ---
  cmd
    .command("import")
    .description("Import a skill from a git URL or local path")
    .argument("<source>", "Git URL or local path to skill directory")
    .option("-n, --name <name>", "Override skill name")
    .option("--dir <dir>", "Skills directory", "skills")
    .action((source: string, opts: { name?: string; dir: string }) => {
      const skillsDir = join(process.cwd(), opts.dir);
      mkdirSync(skillsDir, { recursive: true });

      let sourcePath: string;
      const isGitUrl =
        source.startsWith("https://") ||
        source.startsWith("git@") ||
        source.startsWith("http://");

      if (isGitUrl) {
        // Clone to temp, then copy
        const tmpDir = join(process.cwd(), ".openspawn-tmp-import");
        console.log(`\n${pc.dim("Cloning from")} ${pc.cyan(source)}...`);
        try {
          execSync(`git clone --depth 1 ${source} ${tmpDir}`, { stdio: "pipe" });
          sourcePath = tmpDir;
        } catch {
          console.log(
            `\n${icons.error} Failed to clone ${pc.cyan(source)}. Check the URL and try again.\n`,
          );
          return;
        }
      } else {
        sourcePath = resolve(source);
      }

      // Check if source has SKILL.md directly, or has subdirectories with skills
      if (existsSync(join(sourcePath, "SKILL.md"))) {
        // Single skill
        const { valid, errors } = validateSkillDir(sourcePath);
        if (!valid) {
          console.log(`\n${icons.error} ${pc.red("Invalid skill:")}`);
          for (const err of errors) {
            console.log(`  ${pc.yellow("•")} ${err}`);
          }
          console.log(
            pc.dim("\n  Skills must have a SKILL.md with at least 'name' and 'description' in frontmatter.\n"),
          );
          cleanup(sourcePath, isGitUrl);
          return;
        }

        const content = readFileSync(join(sourcePath, "SKILL.md"), "utf-8");
        const { frontmatter } = parseFrontmatter(content);
        const skillName = opts.name || frontmatter.name || basename(sourcePath);
        const destDir = join(skillsDir, skillName);

        cpSync(sourcePath, destDir, { recursive: true });
        console.log(`\n${icons.check} ${pc.green("Imported skill:")} ${pc.cyan(skillName)}`);
        console.log(`  ${pc.dim("Location:")} ${destDir}\n`);
      } else {
        // Look for subdirectories with SKILL.md
        const subdirs = readdirSync(sourcePath).filter((e) => {
          const p = join(sourcePath, e);
          return statSync(p).isDirectory() && existsSync(join(p, "SKILL.md"));
        });

        if (subdirs.length === 0) {
          console.log(
            `\n${icons.error} No SKILL.md found in ${pc.cyan(sourcePath)} or its subdirectories.\n`,
          );
          cleanup(sourcePath, isGitUrl);
          return;
        }

        console.log(
          `\n${pc.bold("Found")} ${pc.cyan(String(subdirs.length))} ${pc.bold("skills:")}\n`,
        );
        let imported = 0;
        for (const sub of subdirs) {
          const subPath = join(sourcePath, sub);
          const { valid } = validateSkillDir(subPath);
          if (valid) {
            const content = readFileSync(join(subPath, "SKILL.md"), "utf-8");
            const { frontmatter } = parseFrontmatter(content);
            const skillName = frontmatter.name || sub;
            const destDir = join(skillsDir, skillName);
            cpSync(subPath, destDir, { recursive: true });
            console.log(`  ${icons.check} ${pc.green(skillName)}`);
            imported++;
          } else {
            console.log(`  ${icons.warning} ${pc.yellow(sub)} — invalid, skipped`);
          }
        }
        console.log(`\n${pc.bold(`Imported ${imported}/${subdirs.length} skills.`)}\n`);
      }

      cleanup(sourcePath, isGitUrl);
    });

  // --- skills export ---
  cmd
    .command("export")
    .description("Export an agent role template as a standalone SKILL.md")
    .argument("<role>", "Path to role template YAML file")
    .option("-o, --output <dir>", "Output directory", ".")
    .action((rolePath: string, opts: { output: string }) => {
      const resolved = resolve(rolePath);
      if (!existsSync(resolved)) {
        console.log(`\n${icons.error} Role template not found: ${pc.cyan(resolved)}\n`);
        return;
      }

      const content = readFileSync(resolved, "utf-8");

      // Parse YAML-ish role template
      const nameMatch = content.match(/^name:\s+(.+)$/m);
      const roleMatch = content.match(/^role:\s+(.+)$/m);
      const descMatch = content.match(/system_prompt:\s*\|\n([\s\S]*?)(?=\n\w|$)/);

      const name = nameMatch?.[1]?.trim() || basename(resolved, ".yaml");
      const role = roleMatch?.[1]?.trim() || "agent";
      const systemPrompt = descMatch?.[1] || "";

      // Extract first paragraph of system prompt as description
      const firstParagraph = systemPrompt
        .split("\n\n")[0]
        ?.replace(/^\s+/gm, "")
        .trim() || `OpenSpawn ${name} agent role`;

      const skillMd = `---
name: ${role}
version: 1.0.0
description: |
  ${firstParagraph}
  Exported from OpenSpawn agent role template.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
---

# ${name}

${systemPrompt.replace(/^\s{2}/gm, "")}

---

*Exported from OpenSpawn role template. Source: [OpenSpawn](https://github.com/openspawn/openspawn)*
`;

      const outputDir = resolve(opts.output, role);
      mkdirSync(outputDir, { recursive: true });
      const outputPath = join(outputDir, "SKILL.md");
      writeFileSync(outputPath, skillMd);

      console.log(`\n${icons.check} ${pc.green("Exported skill:")} ${pc.cyan(name)}`);
      console.log(`  ${pc.dim("Location:")} ${outputPath}`);
      console.log(
        pc.dim(`\n  To use in Claude Code: cp -r ${outputDir} .claude/skills/${role}\n`),
      );
    });

  return cmd;
}

function cleanup(path: string, isGitClone: boolean): void {
  if (isGitClone) {
    try {
      execSync(`rm -rf ${path}`, { stdio: "pipe" });
    } catch {
      // ignore cleanup errors
    }
  }
}
