#!/usr/bin/env node
// OpenSpawn CLI — AI agent orchestration control plane

import { showHelp, getVersion } from './help.js';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { statusCommand } from './commands/status.js';
import { demoCommand } from './commands/demo.js';

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  showHelp();
} else if (command === '--version' || command === '-v') {
  console.log(getVersion());
} else if (command === 'init') {
  initCommand(args[1]);
} else if (command === 'start') {
  startCommand();
} else if (command === 'status') {
  statusCommand();
} else if (command === 'demo') {
  demoCommand();
} else {
  console.log(`\x1b[31mUnknown command: ${command}\x1b[0m\n`);
  showHelp();
  process.exit(1);
}
