#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";

import {
  createAgentsCommand,
  createAuthCommand,
  createCreditsCommand,
  createMessagesCommand,
  createTasksCommand,
} from "./commands/index.js";
import { setJsonOutput, icons, setDemoMode } from "./lib/output.js";

const VERSION = "0.1.0";

// ASCII art banner
const banner = `
  ${pc.cyan("┌─────────────────────────────────────┐")}
  ${pc.cyan("│")}  ${icons.rocket} ${pc.bold(pc.white("OpenSpawn"))} ${pc.dim("CLI")} ${pc.dim(`v${VERSION}`)}          ${pc.cyan("│")}
  ${pc.cyan("│")}  ${pc.dim("Multi-agent coordination platform")}   ${pc.cyan("│")}
  ${pc.cyan("└─────────────────────────────────────┘")}
`;

const program = new Command();

program
  .name("openspawn")
  .description(`${pc.bold("OpenSpawn CLI")} - Multi-agent coordination platform

${pc.cyan("Commands:")}
  ${pc.yellow("auth")}      Authenticate with OpenSpawn API
  ${pc.yellow("agents")}    Manage AI agents
  ${pc.yellow("tasks")}     Create and track tasks
  ${pc.yellow("credits")}   View and transfer credits
  ${pc.yellow("messages")}  Send messages between agents

${pc.cyan("Examples:")}
  ${pc.dim("$")} openspawn auth login --api-key osp_xxxxx
  ${pc.dim("$")} openspawn agents list
  ${pc.dim("$")} openspawn tasks create --title "Build feature"
  ${pc.dim("$")} openspawn credits balance

${pc.cyan("Documentation:")}
  ${pc.underline("https://openspawn.github.io/openspawn")}`)
  .version(VERSION, "-v, --version", "Show version number")
  .option("--json", "Output in JSON format")
  .option("--no-color", "Disable colored output")
  .option("--demo", "Use demo mode with mock data (no API required)")
  .configureOutput({
    writeOut: (str) => process.stdout.write(str),
    writeErr: (str) => process.stderr.write(str),
    outputError: (str, write) => write(`${pc.red(icons.cross)} ${str}`),
  })
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.json) {
      setJsonOutput(true);
    }
    if (opts.demo) {
      setDemoMode(true);
    }
    if (opts.color === false) {
      // Colors are disabled via --no-color
    }
  })
  .addHelpCommand("help [command]", "Display help for command")
  .showHelpAfterError("(use --help for available options)");

// Add subcommands
program.addCommand(createAuthCommand());
program.addCommand(createAgentsCommand());
program.addCommand(createTasksCommand());
program.addCommand(createCreditsCommand());
program.addCommand(createMessagesCommand());

// Custom help formatting
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => pc.yellow(cmd.name()),
});

// Show banner on --help
const originalHelp = program.helpInformation.bind(program);
program.helpInformation = function () {
  return banner + "\n" + originalHelp();
};

// Parse and run
program.parse();

// Show help if no command provided
if (process.argv.length <= 2) {
  console.log(banner);
  program.outputHelp();
}
