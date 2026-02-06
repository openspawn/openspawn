import { z } from "zod";

import type { ApiClient } from "../api-client";

export function registerCreditTools(
  server: {
    tool: (
      name: string,
      description: string,
      schema: z.ZodObject<z.ZodRawShape>,
      handler: (params: Record<string, unknown>) => Promise<unknown>,
    ) => void;
  },
  client: ApiClient,
) {
  server.tool("credits_balance", "Get current credit balance", z.object({}), async () => {
    const result = await client.getBalance();
    return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
  });

  server.tool(
    "credits_spend",
    "Spend credits for a specific purpose",
    z.object({
      amount: z.number().int().positive().describe("Amount to spend"),
      reason: z.string().describe("Reason for spending"),
    }),
    async (params) => {
      const result = await client.spendCredits(params.amount, params.reason);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    },
  );

  server.tool(
    "credits_history",
    "Get credit transaction history",
    z.object({
      limit: z.number().int().positive().default(50).describe("Number of records"),
      offset: z.number().int().nonnegative().default(0).describe("Offset for pagination"),
    }),
    async (params) => {
      const result = await client.getCreditHistory(params.limit, params.offset);
      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    },
  );
}
