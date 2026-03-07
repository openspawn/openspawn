import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseOrgMd, generateOrgMd } from "../../core/org-parser.js";
import type { ParsedOrg } from "../../core/types.js";

export function hireCommand(args: string[], ctx: { dir: string; orgFile?: string }) {
  const name = args.find((a) => !a.startsWith("--"));
  if (!name) {
    console.error("Usage: openspawn hire <name> [--level N] [--model M] [--parent P]");
    return;
  }

  const orgPath = ctx.orgFile ?? join(ctx.dir, "ORG.md");
  let org: ParsedOrg;
  if (existsSync(orgPath)) {
    org = parseOrgMd(orgPath);
  } else {
    org = { name: "Unnamed Org", agents: [], culture: {}, policies: {} };
  }

  const levelIdx = args.indexOf("--level");
  const level = levelIdx >= 0 ? parseInt(args[levelIdx + 1]) || 4 : 4;
  const modelIdx = args.indexOf("--model");
  const model = modelIdx >= 0 ? args[modelIdx + 1] : undefined;
  const parentIdx = args.indexOf("--parent");
  const parent = parentIdx >= 0 ? args[parentIdx + 1] : undefined;

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  org.agents.push({
    id,
    name,
    role: "worker",
    level,
    domain: "general",
    parentId: parent,
    model,
    status: "active",
  });
  writeFileSync(orgPath, generateOrgMd(org));
  console.log(`Hired ${name} (L${level})`);
}
