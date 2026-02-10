import { getApiKey, getApiUrl } from "./config.js";
import { isDemoMode } from "./output.js";
import { DemoClient } from "./demo-client.js";
import type { ApiResponse, ApiError } from "./types.js";

export type { ApiResponse, ApiError };

/** Unwrap API response data - throws if data is missing */
export function unwrap<T>(response: ApiResponse<T>): T {
  if (response.data === undefined) {
    throw new Error(response.error ?? response.message ?? "No data in response");
  }
  return response.data;
}

export class OpenSpawnClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.baseUrl = baseUrl ?? getApiUrl();
    this.apiKey = apiKey ?? getApiKey() ?? "";

    if (!this.apiKey) {
      throw new Error(
        "No API key configured. Run: openspawn auth login --api-key <key>",
      );
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        message: data.message ?? data.error ?? "Request failed",
        statusCode: response.status,
      };
      throw error;
    }

    return data as T;
  }

  async whoami(): Promise<ApiResponse> {
    return this.request("GET", "/agents");
  }

  async listAgents(): Promise<ApiResponse> {
    return this.request("GET", "/agents");
  }

  async getAgent(id: string): Promise<ApiResponse> {
    return this.request("GET", `/agents/${id}`);
  }

  async createAgent(data: {
    name: string;
    agentId: string;
    level: number;
    role?: string;
  }): Promise<ApiResponse> {
    return this.request("POST", "/agents/register", data);
  }

  async listTasks(params?: { status?: string }): Promise<ApiResponse> {
    const query = params?.status ? `?status=${params.status}` : "";
    return this.request("GET", `/tasks${query}`);
  }

  async getTask(id: string): Promise<ApiResponse> {
    return this.request("GET", `/tasks/${id}`);
  }

  async createTask(data: {
    title: string;
    priority: string;
    description?: string;
  }): Promise<ApiResponse> {
    return this.request("POST", "/tasks", data);
  }

  async assignTask(taskId: string, assigneeId: string): Promise<ApiResponse> {
    return this.request("POST", `/tasks/${taskId}/assign`, { assigneeId });
  }

  async transitionTask(taskId: string, status: string): Promise<ApiResponse> {
    return this.request("POST", `/tasks/${taskId}/transition`, { status });
  }

  async getBalance(agentId?: string): Promise<ApiResponse> {
    if (agentId) {
      return this.request("GET", `/agents/${agentId}/credits/balance`);
    }
    return this.request("GET", "/credits/balance");
  }

  async transferCredits(
    fromId: string,
    toId: string,
    amount: number,
  ): Promise<ApiResponse> {
    return this.request("POST", "/agents/credits/transfer", {
      fromAgentId: fromId,
      toAgentId: toId,
      amount,
    });
  }

  async listMessages(channelId: string): Promise<ApiResponse> {
    return this.request("GET", `/messages?channelId=${channelId}`);
  }

  async sendMessage(
    recipientId: string,
    content: string,
  ): Promise<ApiResponse> {
    return this.request("POST", "/dm", {
      recipientId,
      body: content,
    });
  }

  async listChannels(): Promise<ApiResponse> {
    return this.request("GET", "/channels");
  }
}

export function createClient(): OpenSpawnClient | DemoClient {
  if (isDemoMode()) {
    return new DemoClient();
  }
  return new OpenSpawnClient();
}
