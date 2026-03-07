// ── openspawn promote ────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Command } from "commander";
import { readConfig, findAgent } from "./config.js";
import { generateSoulMd } from "./templates.js";

function parseSoulMd(content: string): {
  name?: string;
  role?: string;
  level?: number;
  domain?: string;
  reportsTo?: string;
} {
  const get = (label: string) => {
    const m = content.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`));
    return m ? m[1].trim() : undefined;
  };
  return {
    name: get("Name"),
    role: get("Role"),
    level: get("Level") ? parseInt(get("Level")!.replace(/^L/, ""), 10) : undefined,
    domain: get("Domain"),
    reportsTo: get("Reports to"),
  };
}

export function registerPromoteCommand(program: Command): void {
  program
    .command("promote <agentId>")
    .description("Change an agent's role or level")
    .option("--to <role>", "New role title")
    .option("--level <level>", "New level (1-10)")
    .option("--domain <domain>", "New domain")
    .option("--notify", "Send notification to the agent about their new role", true)
    .option("--no-notify", "Skip notification")
    .action((agentId: string, opts) => {
      const config = readConfig();
      const agent = findAgent(config, agentId);

      if (!agent) {
        console.error(`❌ Agent "${agentId}" not found in config.`);
        process.exit(1);
      }

      // Read current SOUL.md
      const ocDir = join(homedir(), ".openclaw");
      const workspaceDir = agent.workspace || join(ocDir, `workspace-${agentId}`);
      const soulPath = join(workspaceDir, "SOUL.md");

      if (!existsSync(soulPath)) {
        console.error(`❌ SOUL.md not found at ${soulPath}`);
        process.exit(1);
      }

      const currentSoul = parseSoulMd(readFileSync(soulPath, "utf-8"));

      const newRole = opts.to || currentSoul.role || "Agent";
      const newLevel = opts.level
        ? Math.min(10, Math.max(1, parseInt(opts.level, 10)))
        : currentSoul.level || 4;
      const newDomain = opts.domain || currentSoul.domain || "general";

      // Print before/after
      console.log(`\n📊 Promotion Summary for "${agentId}":\n`);
      console.log(`  Role:   ${currentSoul.role || "?"} → ${newRole}`);
      console.log(`  Level:  L${currentSoul.level || "?"} → L${newLevel}`);
      console.log(`  Domain: ${currentSoul.domain || "?"} → ${newDomain}`);

      // Write new SOUL.md
      writeFileSync(
        soulPath,
        generateSoulMd({
          name: currentSoul.name || agentId,
          role: newRole,
          level: newLevel,
          domain: newDomain,
          reportsTo: currentSoul.reportsTo,
        }),
      );
      console.log(`\n✅ SOUL.md updated.`);

      // Update ORG.md if it exists
      const orgPath = join(workspaceDir, "ORG.md");
      if (existsSync(orgPath)) {
        let orgContent = readFileSync(orgPath, "utf-8");
        // Simple replacement of role/level mentions
        if (currentSoul.role) {
          orgContent = orgContent.replace(new RegExp(currentSoul.role, "g"), newRole);
        }
        if (currentSoul.level) {
          orgContent = orgContent.replace(new RegExp(`L${currentSoul.level}`, "g"), `L${newLevel}`);
        }
        writeFileSync(orgPath, orgContent);
        console.log(`✅ ORG.md updated.`);
      }

      // Notify agent
      if (opts.notify) {
        try {
          execSync(
            `openclaw sessions send --agent ${agentId} --message "🎉 You've been promoted! New role: ${newRole} (L${newLevel}). Domain: ${newDomain}. Your SOUL.md has been updated — re-read it next session."`,
            { stdio: "inherit", timeout: 10000 },
          );
          console.log(`📨 Notification sent.`);
        } catch {
          console.warn(`⚠️  Could not notify agent. They'll pick up changes on next session.`);
        }
      }

      console.log("");
    });
}
