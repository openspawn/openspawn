import { Command } from "commander";
import { createClient } from "../lib/api.js";
import { output, outputError } from "../lib/output.js";

export function createCreditsCommand(): Command {
  const credits = new Command("credits").description("Manage credits");

  credits
    .command("balance [agentId]")
    .description("Get credit balance for an agent")
    .action(async (agentId) => {
      try {
        const client = createClient();
        const response = await client.getBalance(agentId);
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  credits
    .command("transfer")
    .description("Transfer credits between agents")
    .requiredOption("--from <id>", "Source agent ID")
    .requiredOption("--to <id>", "Destination agent ID")
    .requiredOption("--amount <n>", "Amount to transfer")
    .action(async (opts) => {
      try {
        const client = createClient();
        const response = await client.transferCredits(
          opts.from,
          opts.to,
          parseInt(opts.amount, 10),
        );
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return credits;
}
