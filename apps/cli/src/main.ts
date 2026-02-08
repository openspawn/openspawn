#!/usr/bin/env node

import { Command } from "commander";

import {
  createAgentsCommand,
  createAuthCommand,
  createCreditsCommand,
  createMessagesCommand,
  createTasksCommand,
} from "./commands/index.js";
import { setJsonOutput } from "./lib/output.js";

const program = new Command();

program
  .name("openspawn")
  .description("OpenSpawn CLI - Multi-agent coordination platform")
  .version("0.1.0")
  .option("--json", "Output in JSON format")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.json) {
      setJsonOutput(true);
    }
  });

program.addCommand(createAuthCommand());
program.addCommand(createAgentsCommand());
program.addCommand(createTasksCommand());
program.addCommand(createCreditsCommand());
program.addCommand(createMessagesCommand());

program.parse();
