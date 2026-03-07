import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseOrgMd, generateOrgMd } from "../../core/org-parser.js";

export function fireCommand(args: string[], ctx: { dir: string; orgFile?: string }) {
  const name = args[0];
  if (!name) {
    console.error("Usage: openspawn fire <name>");
    return;
  }

  const orgPath = ctx.orgFile ?? join(ctx.dir, "ORG.md");
  if (!existsSync(orgPath)) {
    console.error("No ORG.md found.");
    return;
  }

  const org = parseOrgMd(orgPath);
  const before = org.agents.length;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  org.agents = org.agents.filter((a) => a.id !== id && a.name.toLowerCase() !== name.toLowerCase());
  writeFileSync(orgPath, generateOrgMd(org));
  console.log(org.agents.length < before ? `Removed ${name}.` : `Agent "${name}" not found.`);
}
