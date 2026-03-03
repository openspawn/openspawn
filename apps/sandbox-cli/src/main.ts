#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";

import {
  createAgentsCommand,
  createAuthCommand,
  createCreditsCommand,
  createInitCommand,
  createMessagesCommand,
  createTasksCommand,
} from "./commands/index.js";
import { setJsonOutput, icons, setDemoMode } from "./lib/output.js";

const VERSION = "2026.3.3";

const banner = `
${pc.cyan("┌──────────────────────────────────────────┐")}
${pc.cyan("│")}  ${icons.rocket} ${pc.bold(pc.white("OpenSpawn CLI"))} ${pc.dim(`v${VERSION}`)}              ${pc.cyan("│")}
${pc.cyan("│")}  ${pc.dim("Coordination layer for AI agent orgs")}    ${pc.cyan("│")}
${pc.cyan("└──────────────────────────────────────────┘")}
`;

const program = new Command();

program
  .name("openspawn")
  .description(`${pc.bold("OpenSpawn CLI")} - Coordination layer for AI agent organizations

${pc.dim("Commands:")}
  ${pc.cyan("init")}       Scaffold a new organization (ORG.md)
  ${pc.cyan("agents")}     Manage AI agents
  ${pc.cyan("tasks")}      Create and track tasks
  ${pc.cyan("credits")}    View and transfer credits
  ${pc.cyan("messages")}   Send messages between agents

${pc.dim("Examples:")}
  $ ${pc.green("openspawn init my-org")}
  $ ${pc.green("openspawn init my-agency --template agency")}
  $ ${pc.green("openspawn agents list")}
  $ ${pc.green("openspawn tasks create --title \"Build feature\"")}

${pc.dim("Documentation:")}
  ${pc.cyan("https://openspawn.ai/docs/getting-started")}`)
  .option("-v, --version", "Show version number")
  .option("--json", "Output in JSON format")
  .option("--no-color", "Disable colored output")
  .option("--demo", "Use demo mode with mock data (no API required)")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.json) setJsonOutput(true);
    if (opts.demo) setDemoMode(true);
  });

program.on("option:version", () => {
  console.log(VERSION);
  process.exit(0);
});

// Register commands
program.addCommand(createInitCommand());
program.addCommand(createAuthCommand());
program.addCommand(createAgentsCommand());
program.addCommand(createTasksCommand());
program.addCommand(createCreditsCommand());
program.addCommand(createMessagesCommand());

// Show banner on --help or no args
if (process.argv.length <= 2) {
  console.log(banner);
}

program.parse();
