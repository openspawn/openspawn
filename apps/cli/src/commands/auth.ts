import { Command } from "commander";
import pc from "picocolors";
import { getApiKey, getApiUrl, setApiKey, setApiUrl } from "../lib/config.js";
import {
  outputSuccess,
  outputError,
  formatStatus,
  formatKeyValue,
  icons,
  colors,
} from "../lib/output.js";
import { withSpinner } from "../lib/spinner.js";
import { OpenSpawnClient } from "../lib/api.js";

export function createAuthCommand(): Command {
  const auth = new Command("auth")
    .description("Authenticate with the OpenSpawn API")
    .addHelpText(
      "after",
      `
${pc.cyan("Examples:")}
  ${pc.dim("$")} openspawn auth login --api-key osp_abc123
  ${pc.dim("$")} openspawn auth login --api-key osp_abc123 --api-url https://api.example.com
  ${pc.dim("$")} openspawn auth whoami
  ${pc.dim("$")} openspawn auth logout
`
    );

  auth
    .command("login")
    .description("Configure API credentials")
    .requiredOption("--api-key <key>", "API key (must start with osp_)")
    .option("--api-url <url>", "API URL (default: http://localhost:3000)")
    .action(async (options: { apiKey: string; apiUrl?: string }) => {
      // Validate API key format
      if (!options.apiKey.startsWith("osp_")) {
        outputError(
          "Invalid API key format",
          "API keys must start with 'osp_'"
        );
        process.exit(1);
      }

      // Save credentials
      setApiKey(options.apiKey);
      if (options.apiUrl) {
        setApiUrl(options.apiUrl);
      }

      const apiUrl = getApiUrl();

      // Verify connection
      try {
        await withSpinner("Verifying credentials...", async () => {
          const client = new OpenSpawnClient(options.apiKey, apiUrl);
          await client.whoami();
        });

        console.log();
        outputSuccess("Authentication configured successfully!");
        console.log();
        console.log(`  ${icons.key} API Key: ${pc.dim(options.apiKey.slice(0, 12))}${pc.dim("...")}`);
        console.log(`  ${icons.arrow} Endpoint: ${pc.underline(apiUrl)}`);
        console.log(`  ${icons.check} Saved to: ${pc.dim("~/.openspawn/config.json")}`);
        console.log();
      } catch (error) {
        outputError(
          "Failed to verify credentials",
          "Check your API key and try again"
        );
        // Still save the credentials, but warn
        outputSuccess("Credentials saved (unverified)");
        process.exit(1);
      }
    });

  auth
    .command("whoami")
    .description("Show current authentication status")
    .action(async () => {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      if (!apiKey) {
        formatStatus(false, apiUrl);
        process.exit(1);
      }

      try {
        const data = await withSpinner("Checking authentication...", async () => {
          const client = new OpenSpawnClient(apiKey, apiUrl);
          return client.whoami();
        });

        console.log();
        console.log(`  ${icons.success} ${pc.green("Authenticated")}`);
        console.log();
        
        formatKeyValue({
          "API URL": pc.underline(apiUrl),
          "API Key": `${apiKey.slice(0, 12)}...`,
          "Status": pc.green("Active"),
        });

      } catch (error) {
        console.log();
        console.log(`  ${icons.error} ${pc.red("Authentication failed")}`);
        console.log();
        
        formatKeyValue({
          "API URL": pc.underline(apiUrl),
          "API Key": `${apiKey.slice(0, 12)}...`,
          "Status": pc.red("Invalid"),
        });

        console.log(`  ${pc.dim("Run:")} ${pc.cyan("openspawn auth login --api-key <key>")}`);
        console.log();
        process.exit(1);
      }
    });

  auth
    .command("logout")
    .description("Remove stored credentials")
    .action(() => {
      const hadKey = !!getApiKey();
      setApiKey("");

      if (hadKey) {
        outputSuccess("Credentials removed");
        console.log(`  ${pc.dim("Config cleared:")} ~/.openspawn/config.json`);
        console.log();
      } else {
        console.log(`  ${pc.dim("No credentials to remove")}`);
        console.log();
      }
    });

  auth
    .command("status")
    .description("Show connection status")
    .action(() => {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();
      formatStatus(!!apiKey, apiUrl);
    });

  return auth;
}
