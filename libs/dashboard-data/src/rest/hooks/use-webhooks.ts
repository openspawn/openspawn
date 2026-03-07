// Webhook CRUD hooks — stubbed until generic webhook endpoints exist in FastAPI
// The OpenAPI schema currently only has /integrations/github/webhook and /integrations/linear/webhook

export function useWebhooks() {
  return { data: undefined, isLoading: false, error: null };
}

export function useWebhook(_webhookId: string) {
  return { data: undefined, isLoading: false, error: null };
}

export function useCreateWebhook() {
  return {
    mutateAsync: async (_body: { url: string; events: string[] }) => {
      throw new Error("Webhook CRUD not yet implemented in FastAPI");
    },
    isPending: false,
  };
}

export function useDeleteWebhook() {
  return {
    mutateAsync: async (_webhookId: string) => {
      throw new Error("Webhook CRUD not yet implemented in FastAPI");
    },
    isPending: false,
  };
}
