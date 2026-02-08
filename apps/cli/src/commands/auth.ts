import { Command } from "commander";
import { getApiKey, getApiUrl, setApiKey, setApiUrl } from "../lib/config.js";
import { output, outputError, outputSuccess } from "../lib/output.js";
import { OpenSpawnClient } from "../lib/api.js";

export function createAuthCommand(): Command {
  const auth = new Command("auth").description("Authentication commands");

  auth
    .command("login")
    .description("Configure API credentials")
    .requiredOption("--api-key <key>", "API key (osp_...)")
    .option("--api-url <url>", "API URL (default: http://localhost:3000)")
    .action((options: { apiKey: string; apiUrl?: string }) => {
      if (!options.apiKey.startsWith("osp_")) {
        outputError("API key must start with 'osp_'");
        process.exit(1);
      }
      setApiKey(options.apiKey);
      if (options.apiUrl) setApiUrl(options.apiUrl);
      outputSuccess("Credentials saved to ~/.openspawn/config.json");
    });

  auth
    .command("whoami")
    .description("Show current authentication status")
    .action(async () => {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();
      if (!apiKey) {
        outputError("Not logged in. Run: openspawn auth login --api-key <key>");
        process.exit(1);
      }
      try {
        const client = new OpenSpawnClient(apiKey, apiUrl);
        await client.whoami();
        output({ status: "authenticated", apiUrl, apiKeyPrefix: apiKey.substring(0, 12) + "..." });
      } catch (err) {
        output({ status: "invalid", apiUrl, error: err instanceof Error ? err.message : "Unknown error" });
        process.exit(1);
      }
    });

  auth
    .command("logout")
    .description("Remove stored credentials")
    .action(() => {
      setApiKey("");
      outputSuccess("Credentials removed");
    });

  return auth;
}
