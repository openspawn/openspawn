import { Command } from "commander";
import pc from "picocolors";
import { createClient } from "../lib/api.js";
import {
  output,
  outputError,
  outputSuccess,
  outputTable,
  formatEmpty,
  icons,
  colors,
} from "../lib/output.js";
import { withSpinner } from "../lib/spinner.js";

interface Message {
  id: string;
  senderId: string;
  sender?: { name: string };
  body: string;
  createdAt: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  memberCount?: number;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return pc.dim("now");
  if (diffMins < 60) return pc.dim(`${diffMins}m`);
  if (diffHours < 24) return pc.dim(`${diffHours}h`);
  
  return pc.dim(date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
}

function formatChannelType(type: string): string {
  switch (type?.toUpperCase()) {
    case "DIRECT":
      return pc.cyan("DM");
    case "GROUP":
      return pc.green("Group");
    case "TASK":
      return pc.yellow("Task");
    default:
      return pc.dim(type);
  }
}

export function createMessagesCommand(): Command {
  const messages = new Command("messages")
    .alias("msg")
    .description("Send and receive messages")
    .addHelpText(
      "after",
      `
${pc.cyan("Examples:")}
  ${pc.dim("$")} openspawn messages send --to agent-123 --content "Hello!"
  ${pc.dim("$")} openspawn messages list --channel ch_abc123
  ${pc.dim("$")} openspawn messages channels
  ${pc.dim("$")} openspawn msg send --to agent-456 --content "Quick update"
`
    );

  messages
    .command("send")
    .description("Send a direct message")
    .requiredOption("--to <agentId>", "Recipient agent ID")
    .requiredOption("--content <text>", "Message content")
    .action(async (opts) => {
      if (!opts.content.trim()) {
        outputError("Message content cannot be empty");
        process.exit(1);
      }

      try {
        await withSpinner(
          `Sending message to ${pc.cyan(opts.to)}...`,
          async () => {
            const client = createClient();
            return client.sendMessage(opts.to, opts.content);
          },
          { successText: "Message sent!" }
        );

        console.log();
        console.log(`  ${pc.dim("To:")}      ${icons.agent} ${opts.to}`);
        console.log(`  ${pc.dim("Message:")} "${opts.content}"`);
        console.log();
      } catch (err) {
        outputError(
          err instanceof Error ? err.message : String(err),
          "Check the recipient ID and try again"
        );
        process.exit(1);
      }
    });

  messages
    .command("list")
    .description("List messages in a channel")
    .requiredOption("--channel <id>", "Channel ID")
    .option("--limit <n>", "Number of messages", "20")
    .action(async (opts) => {
      try {
        const data = await withSpinner(
          `Fetching messages from ${pc.cyan(opts.channel)}...`,
          async () => {
            const client = createClient();
            return client.listMessages(opts.channel);
          }
        );

        const messageList = ((data.data ?? data) as Message[]) || [];

        if (messageList.length === 0) {
          formatEmpty("No messages in this channel", "Send the first message!");
          return;
        }

        console.log();
        console.log(`  💬 ${pc.bold("Messages")} ${pc.dim(`(${messageList.length})`)}`);
        console.log();

        // Display messages in chat format
        for (const msg of messageList.slice(0, parseInt(opts.limit)).reverse()) {
          const senderName = msg.sender?.name || msg.senderId;
          const time = formatTime(msg.createdAt);
          
          console.log(`  ${pc.cyan(pc.bold(senderName))} ${time}`);
          console.log(`  ${msg.body}`);
          console.log();
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  messages
    .command("channels")
    .description("List available channels")
    .action(async () => {
      try {
        const data = await withSpinner("Fetching channels...", async () => {
          const client = createClient();
          return client.listChannels();
        });

        const channels = ((data.data ?? data) as Channel[]) || [];

        if (channels.length === 0) {
          formatEmpty("No channels found", "Channels are created automatically for tasks and DMs");
          return;
        }

        console.log();
        console.log(`  💬 ${pc.bold(`${channels.length} channel${channels.length === 1 ? "" : "s"}`)}`);
        console.log();

        outputTable({
          headers: ["Name", "Type", "ID"],
          rows: channels.map((c) => [
            pc.bold(c.name),
            formatChannelType(c.type),
            pc.dim(c.id),
          ]),
        });
        console.log();
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  messages
    .command("unread")
    .description("Show unread message count")
    .action(async () => {
      try {
        // TODO: Implement unread endpoint
        console.log();
        console.log(`  📬 ${pc.bold("0")} unread messages`);
        console.log();
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return messages;
}
