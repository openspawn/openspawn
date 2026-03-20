#!/usr/bin/env node
// ── OpenSpawn Agent Management CLI ──────────────────────────────────────────

import { Command } from "commander";
import { registerHireCommand } from "./hire.js";
import { registerFireCommand } from "./fire.js";
import { registerPromoteCommand } from "./promote.js";

const program = new Command();

program
  .name("openspawn")
  .description("OpenSpawn agent management CLI — hire, fire, and promote agents")
  .version("0.1.0");

registerHireCommand(program);
registerFireCommand(program);
registerPromoteCommand(program);

program.parse();
