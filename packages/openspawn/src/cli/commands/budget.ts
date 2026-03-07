import { getBudget, getAllBudgets } from "../../core/budget.js";

export function budgetCommand(args: string[], ctx: { dir: string }) {
  const agentId = args[0];
  if (agentId) {
    const b = getBudget(ctx.dir, agentId);
    if (!b) {
      console.log(`No budget set for ${agentId}.`);
      return;
    }
    const remaining = Math.round((b.limit - b.spent) * 100) / 100;
    console.log(`${agentId}: $${b.spent}/$${b.limit} spent (${remaining} remaining)`);
  } else {
    const all = getAllBudgets(ctx.dir);
    const keys = Object.keys(all);
    if (keys.length === 0) {
      console.log("No budgets set.");
      return;
    }
    for (const id of keys) {
      const b = all[id];
      const remaining = Math.round((b.limit - b.spent) * 100) / 100;
      console.log(`  ${id}: $${b.spent}/$${b.limit} (${remaining} remaining)`);
    }
  }
}
