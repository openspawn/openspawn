/**
 * CLI auth commands for hosted API:
 *   openspawn auth login --api-key osp_xxx [--api-url https://api.openspawn.ai]
 *   openspawn auth whoami
 *   openspawn auth logout
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// ---------------------------------------------------------------------------
// Credentials storage
// ---------------------------------------------------------------------------

const CRED_DIR = join(homedir(), ".openspawn");
const CRED_FILE = join(CRED_DIR, "credentials.json");

interface Credentials {
  api_key: string;
  api_url: string;
}

export function loadCredentials(): Credentials | null {
  if (!existsSync(CRED_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CRED_FILE, "utf-8")) as Credentials;
  } catch {
    return null;
  }
}

function saveCredentials(creds: Credentials): void {
  mkdirSync(CRED_DIR, { recursive: true });
  writeFileSync(CRED_FILE, JSON.stringify(creds, null, 2) + "\n", { mode: 0o600 });
}

function clearCredentials(): void {
  if (existsSync(CRED_FILE)) unlinkSync(CRED_FILE);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiFetch(path: string, apiUrl: string, apiKey: string, init?: RequestInit) {
  const url = `${apiUrl.replace(/\/$/, "")}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    ...(init?.headers as Record<string, string> || {}),
  };
  return fetch(url, { ...init, headers });
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function loginCommand(args: string[]): Promise<void> {
  let apiKey: string | undefined;
  let apiUrl = "https://api.openspawn.ai";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--api-key" && args[i + 1]) {
      apiKey = args[++i];
    } else if (args[i] === "--api-url" && args[i + 1]) {
      apiUrl = args[++i];
    }
  }

  if (!apiKey) {
    console.error("Error: --api-key is required");
    console.error("Usage: openspawn auth login --api-key osp_xxx [--api-url URL]");
    process.exit(1);
  }

  if (!apiKey.startsWith("osp_")) {
    console.error("Error: API key must start with 'osp_'");
    process.exit(1);
  }

  // Verify the key by calling /auth/whoami
  console.log(`Verifying API key with ${apiUrl}...`);

  try {
    const res = await apiFetch("/auth/whoami", apiUrl, apiKey);
    if (!res.ok) {
      const body = await res.text();
      console.error(`Authentication failed (${res.status}): ${body}`);
      process.exit(1);
    }

    const data = (await res.json()) as { email: string; name: string; org_id: string };
    saveCredentials({ api_key: apiKey, api_url: apiUrl });

    console.log(`✓ Authenticated as ${data.email} (${data.name})`);
    console.log(`  Organization: ${data.org_id}`);
    console.log(`  Credentials saved to ${CRED_FILE}`);
  } catch (err) {
    console.error(`Failed to connect to ${apiUrl}: ${err}`);
    process.exit(1);
  }
}

async function whoamiCommand(): Promise<void> {
  const creds = loadCredentials();
  if (!creds) {
    console.error("Not logged in. Run: openspawn auth login --api-key osp_xxx");
    process.exit(1);
  }

  try {
    const res = await apiFetch("/auth/whoami", creds.api_url, creds.api_key);
    if (!res.ok) {
      const body = await res.text();
      console.error(`Failed (${res.status}): ${body}`);
      process.exit(1);
    }

    const data = (await res.json()) as {
      user_id: string;
      org_id: string;
      email: string;
      name: string;
      role: string;
    };

    console.log(`User:  ${data.name} <${data.email}>`);
    console.log(`ID:    ${data.user_id}`);
    console.log(`Org:   ${data.org_id}`);
    console.log(`Role:  ${data.role}`);
    console.log(`API:   ${creds.api_url}`);
  } catch (err) {
    console.error(`Failed to connect: ${err}`);
    process.exit(1);
  }
}

async function logoutCommand(): Promise<void> {
  clearCredentials();
  console.log("✓ Credentials removed.");
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export async function authCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case "login":
      return loginCommand(args.slice(1));
    case "whoami":
      return whoamiCommand();
    case "logout":
      return logoutCommand();
    default:
      console.log(`openspawn auth — Manage API authentication

Commands:
  login --api-key osp_xxx [--api-url URL]   Store API credentials
  whoami                                     Show current user
  logout                                     Remove stored credentials`);
      if (subcommand && subcommand !== "--help" && subcommand !== "-h") {
        console.error(`\nUnknown subcommand: ${subcommand}`);
        process.exit(1);
      }
  }
}
