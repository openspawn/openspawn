import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseOrgMd } from "../../core/org-parser.js";
import { loadStore } from "../../core/task-store.js";

export function statusCommand(_args: string[], ctx: { dir: string; orgFile?: string }) {
  const orgPath = ctx.orgFile ?? join(ctx.dir, "ORG.md");
  if (!existsSync(orgPath)) {
    console.log("No ORG.md found. Run `openspawn init` first.");
    return;
  }
  const org = parseOrgMd(orgPath);
  const store = loadStore(ctx.dir);

  console.log(`Organization: ${org.name}`);
  console.log(`Agents: ${org.agents.length}`);
  console.log(
    `Tasks: ${store.tasks.length} (${store.tasks.filter((t) => t.status === "open").length} open, ${store.tasks.filter((t) => t.status === "done").length} done)`,
  );
  console.log();
  for (const agent of org.agents) {
    const tasks = store.tasks.filter((t) => t.assignee === agent.id);
    console.log(`  ${agent.name} (L${agent.level} ${agent.role}) — ${tasks.length} tasks`);
  }
}
