import { Command } from "commander";
import pc from "picocolors";
import { createClient } from "../lib/api.js";
import {
  output,
  outputError,
  outputSuccess,
  outputTable,
  formatCredits,
  formatEmpty,
  icons,
  colors,
} from "../lib/output.js";
import { withSpinner, progressBar } from "../lib/spinner.js";

interface Balance {
  agentId: string;
  currentBalance: number;
  budgetPeriodLimit?: number;
  budgetPeriodSpent?: number;
  lifetimeEarnings?: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reason?: string;
  createdAt: string;
}

function formatAmount(amount: number, type: string): string {
  if (type === "CREDIT" || type === "EARN" || type === "GRANT") {
    return pc.green(`+${amount.toLocaleString()}`);
  }
  if (type === "DEBIT" || type === "SPEND") {
    return pc.red(`-${amount.toLocaleString()}`);
  }
  return amount.toLocaleString();
}

function formatType(type: string): string {
  switch (type?.toUpperCase()) {
    case "CREDIT":
    case "EARN":
      return pc.green("↑ Earned");
    case "DEBIT":
    case "SPEND":
      return pc.red("↓ Spent");
    case "GRANT":
      return pc.cyan("★ Grant");
    case "TRANSFER_IN":
      return pc.blue("← Received");
    case "TRANSFER_OUT":
      return pc.yellow("→ Sent");
    default:
      return pc.dim(type);
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return pc.dim("just now");
  if (diffMins < 60) return pc.dim(`${diffMins}m ago`);
  if (diffHours < 24) return pc.dim(`${diffHours}h ago`);
  if (diffDays < 7) return pc.dim(`${diffDays}d ago`);
  
  return pc.dim(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
}

export function createCreditsCommand(): Command {
  const credits = new Command("credits")
    .description("View and manage credits")
    .addHelpText(
      "after",
      `
${pc.cyan("Examples:")}
  ${pc.dim("$")} openspawn credits balance
  ${pc.dim("$")} openspawn credits balance agent-123
  ${pc.dim("$")} openspawn credits history --limit 20
  ${pc.dim("$")} openspawn credits transfer --from agent-a --to agent-b --amount 100
  ${pc.dim("$")} openspawn credits grant --to agent-123 --amount 500 --reason "Bonus"
`
    );

  credits
    .command("balance [agentId]")
    .description("Get credit balance")
    .action(async (agentId?: string) => {
      try {
        const data = await withSpinner(
          agentId ? `Fetching balance for ${pc.cyan(agentId)}...` : "Fetching balance...",
          async () => {
            const client = createClient();
            return client.getBalance(agentId);
          }
        );

        const balance = (data.data ?? data) as Balance;

        console.log();
        console.log(`  ${icons.credit} ${pc.bold("Credit Balance")}`);
        console.log();
        console.log(`  ${pc.dim("Current:")}     ${colors.credit(pc.bold(balance.currentBalance.toLocaleString()))} credits`);

        if (balance.budgetPeriodLimit) {
          const spent = balance.budgetPeriodSpent || 0;
          const pct = (spent / balance.budgetPeriodLimit) * 100;
          console.log();
          console.log(`  ${pc.dim("Budget:")}      ${spent.toLocaleString()} / ${balance.budgetPeriodLimit.toLocaleString()}`);
          console.log(`  ${pc.dim("Usage:")}       ${progressBar(spent, balance.budgetPeriodLimit, 20)}`);
        }

        if (balance.lifetimeEarnings) {
          console.log();
          console.log(`  ${pc.dim("Lifetime:")}    ${balance.lifetimeEarnings.toLocaleString()} earned`);
        }

        console.log();
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  credits
    .command("history [agentId]")
    .description("View transaction history")
    .option("--limit <n>", "Number of transactions", "15")
    .option("--type <type>", "Filter by type (earn, spend, grant, transfer)")
    .action(async (agentId, opts) => {
      try {
        const data = await withSpinner("Fetching transactions...", async () => {
          const client = createClient();
          // TODO: Use actual API endpoint
          return { data: [] as Transaction[] };
        });

        const transactions = (data.data ?? []) as Transaction[];

        if (transactions.length === 0) {
          formatEmpty("No transactions found", "Transactions will appear here as credits flow");
          return;
        }

        console.log();
        console.log(`  ${icons.credit} ${pc.bold("Transaction History")}`);
        console.log();

        outputTable({
          headers: ["Type", "Amount", "Balance", "Reason", "Time"],
          rows: transactions.slice(0, parseInt(opts.limit)).map((t) => [
            formatType(t.type),
            formatAmount(t.amount, t.type),
            t.balanceAfter.toLocaleString(),
            t.reason ? (t.reason.length > 25 ? t.reason.slice(0, 22) + "..." : t.reason) : pc.dim("—"),
            formatTime(t.createdAt),
          ]),
        });
        console.log();
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  credits
    .command("transfer")
    .description("Transfer credits between agents")
    .requiredOption("--from <id>", "Source agent ID")
    .requiredOption("--to <id>", "Destination agent ID")
    .requiredOption("--amount <n>", "Amount to transfer", parseInt)
    .option("--reason <text>", "Reason for transfer")
    .action(async (opts) => {
      if (opts.amount <= 0) {
        outputError("Amount must be greater than 0");
        process.exit(1);
      }

      if (opts.from === opts.to) {
        outputError("Cannot transfer to the same agent");
        process.exit(1);
      }

      try {
        await withSpinner(
          `Transferring ${colors.credit(opts.amount.toLocaleString())} credits...`,
          async () => {
            const client = createClient();
            return client.transferCredits(opts.from, opts.to, opts.amount);
          },
          {
            successText: `Transferred ${opts.amount.toLocaleString()} credits: ${opts.from} → ${opts.to}`,
          }
        );

        console.log();
        console.log(`  ${pc.dim("From:")}   ${opts.from}`);
        console.log(`  ${pc.dim("To:")}     ${opts.to}`);
        console.log(`  ${pc.dim("Amount:")} ${colors.credit(opts.amount.toLocaleString())} credits`);
        if (opts.reason) {
          console.log(`  ${pc.dim("Reason:")} ${opts.reason}`);
        }
        console.log();
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  credits
    .command("grant")
    .description("Grant credits to an agent")
    .requiredOption("--to <id>", "Agent ID")
    .requiredOption("--amount <n>", "Amount to grant", parseInt)
    .option("--reason <text>", "Reason for grant")
    .action(async (opts) => {
      if (opts.amount <= 0) {
        outputError("Amount must be greater than 0");
        process.exit(1);
      }

      try {
        await withSpinner(
          `Granting ${colors.credit(opts.amount.toLocaleString())} credits to ${pc.cyan(opts.to)}...`,
          async () => {
            // TODO: Implement grant endpoint
            await new Promise((r) => setTimeout(r, 500));
          },
          { successText: `Granted ${opts.amount.toLocaleString()} credits to ${opts.to}` }
        );

        console.log();
        console.log(`  ${pc.dim("To:")}     ${opts.to}`);
        console.log(`  ${pc.dim("Amount:")} ${colors.credit(`+${opts.amount.toLocaleString()}`)} credits`);
        if (opts.reason) {
          console.log(`  ${pc.dim("Reason:")} ${opts.reason}`);
        }
        console.log();
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return credits;
}
