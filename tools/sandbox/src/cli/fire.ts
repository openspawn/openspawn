// ── openspawn fire ───────────────────────────────────────────────────────────

import { existsSync, mkdirSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Command } from "commander";
import { readConfig, writeConfig, findAgent, removeAgent } from "./config.js";

export function registerFireCommand(program: Command): void {
  program
    .command("fire <agentId>")
    .description("Remove an agent from the org")
    .option("--graceful", "Send a wrap-up message before removing")
    .option("--force", "Skip confirmation and remove immediately")
    .option("--archive", "Archive workspace instead of leaving it", true)
    .option("--no-archive", "Leave workspace in place")
    .option("--restart", "Restart the gateway after removing agent")
    .action((agentId: string, opts) => {
      const config = readConfig();
      const agent = findAgent(config, agentId);

      if (!agent) {
        console.error(`❌ Agent "${agentId}" not found in config.`);
        process.exit(1);
      }

      if (agent.default) {
        console.error(`❌ Cannot fire the default agent.`);
        process.exit(1);
      }

      // Graceful farewell (best-effort via openclaw CLI)
      if (opts.graceful) {
        console.log(`📨 Sending wrap-up message to ${agentId}...`);
        try {
          execSync(
            `openclaw sessions send --agent ${agentId} --message "Your role is being decommissioned. Please wrap up any in-progress work and save important context to your workspace files."`,
            { stdio: "inherit", timeout: 15000 },
          );
          console.log("   Message sent. Waiting 10s for wrap-up...");
          execSync("sleep 10");
        } catch {
          console.warn("⚠️  Could not send farewell message. Proceeding with removal.");
        }
      }

      // Remove from config
      removeAgent(config, agentId);
      writeConfig(config);
      console.log(`✅ Removed "${agentId}" from agents.list`);

      // Archive workspace
      const ocDir = join(homedir(), ".openclaw");
      const workspaceDir = agent.workspace || join(ocDir, `workspace-${agentId}`);

      if (opts.archive && existsSync(workspaceDir)) {
        const archiveDir = join(ocDir, "archived-workspaces");
        mkdirSync(archiveDir, { recursive: true });
        const dest = join(archiveDir, `${agentId}-${Date.now()}`);
        renameSync(workspaceDir, dest);
        console.log(`📦 Workspace archived to: ${dest}`);
      }

      // Restart gateway
      if (opts.restart) {
        console.log("⚠️  Restarting gateway — active sessions will be interrupted.");
        try {
          execSync("openclaw gateway restart", { stdio: "inherit" });
        } catch {
          console.error("⚠️  Failed to restart gateway.");
        }
      }

      console.log(`\n🔥 Agent "${agentId}" has been fired.`);
    });
}
