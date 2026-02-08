import { Command } from "commander";
import pc from "picocolors";
import { createClient } from "../lib/api.js";
import {
  output,
  outputError,
  outputSuccess,
  outputTable,
  formatAgent,
  formatEmpty,
  icons,
  colors,
} from "../lib/output.js";
import { withSpinner } from "../lib/spinner.js";

interface Agent {
  id: string;
  agentId: string;
  name: string;
  role: string;
  level: number;
  status: string;
  currentBalance: number;
  model?: string;
  trustScore?: number;
}

function formatLevel(level: number): string {
  const levelColor = colors.level(level);
  return levelColor(pc.bold(`L${level}`));
}

function formatStatus(status: string): string {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return pc.green(status);
    case "PENDING":
      return pc.yellow(status);
    case "SUSPENDED":
    case "REVOKED":
      return pc.red(status);
    default:
      return pc.dim(status);
  }
}

function formatBalance(balance: number): string {
  if (balance >= 10000) return pc.green(balance.toLocaleString());
  if (balance >= 1000) return pc.yellow(balance.toLocaleString());
  if (balance >= 100) return balance.toLocaleString();
  return pc.dim(balance.toLocaleString());
}

export function createAgentsCommand(): Command {
  const agents = new Command("agents")
    .description("Manage AI agents in your organization")
    .addHelpText(
      "after",
      `
${pc.cyan("Examples:")}
  ${pc.dim("$")} openspawn agents list
  ${pc.dim("$")} openspawn agents list --status active
  ${pc.dim("$")} openspawn agents get agent-123
  ${pc.dim("$")} openspawn agents create --name "Research Bot" --level 5
`
    );

  agents
    .command("list")
    .description("List all agents")
    .option("--status <status>", "Filter by status (active, pending, suspended)")
    .option("--level <level>", "Filter by level (1-10)", parseInt)
    .action(async (opts) => {
      try {
        const data = await withSpinner("Fetching agents...", async () => {
          const client = createClient();
          return client.listAgents();
        });

        let agentList = (data.data ?? data) as Agent[];

        // Apply filters
        if (opts.status) {
          agentList = agentList.filter(
            (a) => a.status?.toUpperCase() === opts.status.toUpperCase()
          );
        }
        if (opts.level) {
          agentList = agentList.filter((a) => a.level === opts.level);
        }

        if (agentList.length === 0) {
          formatEmpty(
            "No agents found",
            opts.status || opts.level
              ? "Try removing filters"
              : `Run: ${pc.cyan("openspawn agents create --name <name> --level <n>")}`
          );
          return;
        }

        console.log();
        console.log(`  ${icons.agent} ${pc.bold(`${agentList.length} agent${agentList.length === 1 ? "" : "s"}`)}`);
        console.log();

        outputTable({
          headers: ["Name", "ID", "Level", "Status", "Balance", "Trust"],
          rows: agentList.map((a) => [
            pc.bold(a.name),
            pc.dim(a.agentId),
            formatLevel(a.level),
            formatStatus(a.status),
            formatBalance(a.currentBalance),
            a.trustScore !== undefined ? `${a.trustScore}%` : pc.dim("—"),
          ]),
        });
        console.log();
      } catch (err) {
        outputError(
          err instanceof Error ? err.message : String(err),
          "Check your authentication and try again"
        );
        process.exit(1);
      }
    });

  agents
    .command("get <id>")
    .description("Get details for a specific agent")
    .action(async (id: string) => {
      try {
        const data = await withSpinner(`Fetching agent ${pc.cyan(id)}...`, async () => {
          const client = createClient();
          return client.getAgent(id);
        });

        const agent = (data.data ?? data) as Agent;
        formatAgent(agent);
      } catch (err) {
        outputError(
          err instanceof Error ? err.message : String(err),
          "Agent not found or access denied"
        );
        process.exit(1);
      }
    });

  agents
    .command("create")
    .description("Create a new agent")
    .requiredOption("--name <name>", "Agent display name")
    .requiredOption("--level <level>", "Agent level (1-10)", parseInt)
    .option("--agent-id <id>", "Custom agent identifier (defaults to slugified name)")
    .option("--role <role>", "Agent role", "worker")
    .option("--model <model>", "AI model to use")
    .action(async (options: {
      name: string;
      level: number;
      agentId?: string;
      role?: string;
      model?: string;
    }) => {
      // Validate level
      if (options.level < 1 || options.level > 10) {
        outputError("Level must be between 1 and 10");
        process.exit(1);
      }

      try {
        const agentId = options.agentId ?? options.name.toLowerCase().replace(/\s+/g, "-");

        const data = await withSpinner(
          `Creating agent ${pc.cyan(options.name)}...`,
          async () => {
            const client = createClient();
            return client.createAgent({
              name: options.name,
              agentId,
              level: options.level,
              role: options.role,
            });
          },
          { successText: `Agent ${pc.cyan(options.name)} created!` }
        );

        const agent = (data.data ?? data) as Agent;
        formatAgent(agent);
      } catch (err) {
        outputError(
          err instanceof Error ? err.message : String(err),
          "Check the agent name and level"
        );
        process.exit(1);
      }
    });

  agents
    .command("activate <id>")
    .description("Activate a pending agent")
    .action(async (id: string) => {
      try {
        await withSpinner(`Activating agent ${pc.cyan(id)}...`, async () => {
          // TODO: Implement activation endpoint
          await new Promise((r) => setTimeout(r, 500));
        });
        outputSuccess(`Agent ${id} activated`);
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  agents
    .command("suspend <id>")
    .description("Suspend an agent")
    .option("--reason <reason>", "Reason for suspension")
    .action(async (id: string, opts: { reason?: string }) => {
      try {
        await withSpinner(`Suspending agent ${pc.cyan(id)}...`, async () => {
          // TODO: Implement suspension endpoint
          await new Promise((r) => setTimeout(r, 500));
        });
        outputSuccess(`Agent ${id} suspended`);
        if (opts.reason) {
          console.log(`  ${pc.dim("Reason:")} ${opts.reason}`);
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return agents;
}
