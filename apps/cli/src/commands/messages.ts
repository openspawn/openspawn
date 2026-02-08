import { Command } from "commander";
import { createClient } from "../lib/api.js";
import { output, outputError } from "../lib/output.js";

export function createMessagesCommand(): Command {
  const messages = new Command("messages").description("Manage messages");

  messages
    .command("send")
    .description("Send a direct message to an agent")
    .requiredOption("--to <agentId>", "Recipient agent ID")
    .requiredOption("--content <text>", "Message content")
    .action(async (opts) => {
      try {
        const client = createClient();
        const response = await client.sendMessage(opts.to, opts.content);
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  messages
    .command("list")
    .description("List messages in a channel")
    .requiredOption("--channel <id>", "Channel ID")
    .action(async (opts) => {
      try {
        const client = createClient();
        const response = await client.listMessages(opts.channel);
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  messages
    .command("channels")
    .description("List available channels")
    .action(async () => {
      try {
        const client = createClient();
        const response = await client.listChannels();
        output(response);
      } catch (error) {
        outputError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return messages;
}
