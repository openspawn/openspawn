import { Command } from "commander";
import { createClient } from "../lib/api.js";
import { output, outputError, outputTable } from "../lib/output.js";

interface Agent {
  id: string;
  agentId: string;
  name: string;
  role: string;
  level: number;
  status: string;
  currentBalance: number;
}

export function createAgentsCommand(): Command {
  const agents = new Command("agents").description("Agent management commands");

  agents.command("list").description("List all agents").action(async () => {
    try {
      const client = createClient();
      const response = await client.listAgents();
      const agentList = (response.data as Agent[]) ?? [];
      outputTable(
        ["ID", "Agent ID", "Name", "Role", "Level", "Status", "Balance"],
        agentList.map((a) => [a.id.substring(0, 8), a.agentId, a.name, a.role, String(a.level), a.status, String(a.currentBalance)])
      );
    } catch (err) {
      outputError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

  agents.command("get <id>").description("Get agent details").action(async (id: string) => {
    try {
      const client = createClient();
      const response = await client.getAgent(id);
      output(response.data);
    } catch (err) {
      outputError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

  agents
    .command("create")
    .description("Create a new agent")
    .requiredOption("--name <name>", "Agent name")
    .requiredOption("--level <level>", "Agent level (1-10)", parseInt)
    .option("--agent-id <id>", "Custom agent identifier")
    .option("--role <role>", "Agent role", "worker")
    .action(async (options: { name: string; level: number; agentId?: string; role?: string }) => {
      try {
        if (options.level < 1 || options.level > 10) {
          outputError("Level must be between 1 and 10");
          process.exit(1);
        }
        const client = createClient();
        const response = await client.createAgent({
          name: options.name,
          agentId: options.agentId ?? options.name.toLowerCase().replace(/\s+/g, "-"),
          level: options.level,
          role: options.role,
        });
        output(response);
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return agents;
}
