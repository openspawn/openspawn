/**
 * Abstract integration provider interface.
 * GitHub implements this; Linear (#134) and others can reuse it.
 */
export interface IntegrationProvider {
  readonly providerName: string;

  /** Handle an inbound webhook event */
  handleWebhookEvent(orgId: string, event: string, payload: unknown): Promise<void>;

  /** Sync an outbound event to the external service */
  syncOutbound(orgId: string, event: string, data: Record<string, unknown>): Promise<void>;

  /** Test connection health */
  testConnection(connectionId: string): Promise<{ ok: boolean; message: string }>;
}
