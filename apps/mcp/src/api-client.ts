import { createHmac, randomBytes } from "crypto";

interface ApiClientConfig {
  baseUrl: string;
  agentId: string;
  secret: string;
}

export class ApiClient {
  private baseUrl: string;
  private agentId: string;
  private secret: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.agentId = config.agentId;
    this.secret = config.secret;
  }

  private sign(
    method: string,
    path: string,
    timestamp: string,
    nonce: string,
    body: string,
  ): string {
    const message = `${method}${path}${timestamp}${nonce}${body}`;
    return createHmac("sha256", this.secret).update(message).digest("hex");
  }

  async request<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = randomBytes(16).toString("hex");
    const bodyStr = body ? JSON.stringify(body) : "";

    const signature = this.sign(method, path, timestamp, nonce, bodyStr);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Agent-Id": this.agentId,
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Signature": signature,
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: bodyStr || undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API error ${response.status}: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  // Task operations
  async listTasks(filters?: {
    status?: string;
    assigneeId?: string;
  }): Promise<{ data: unknown[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.assigneeId) params.set("assigneeId", filters.assigneeId);
    const query = params.toString();
    return this.request("GET", `/tasks${query ? `?${query}` : ""}`);
  }

  async createTask(data: {
    title: string;
    description?: string;
    priority?: string;
    assigneeId?: string;
  }): Promise<{ data: unknown }> {
    return this.request("POST", "/tasks", data);
  }

  async getTask(id: string): Promise<{ data: unknown }> {
    return this.request("GET", `/tasks/${id}`);
  }

  async transitionTask(id: string, status: string, reason?: string): Promise<{ data: unknown }> {
    return this.request("POST", `/tasks/${id}/transition`, { status, reason });
  }

  async assignTask(id: string, assigneeId: string): Promise<{ data: unknown }> {
    return this.request("POST", `/tasks/${id}/assign`, { assigneeId });
  }

  async addTaskComment(taskId: string, body: string): Promise<{ data: unknown }> {
    return this.request("POST", `/tasks/${taskId}/comments`, { body });
  }

  // Credit operations
  async getBalance(): Promise<{ data: unknown }> {
    return this.request("GET", "/credits/balance");
  }

  async spendCredits(amount: number, reason: string): Promise<{ data: unknown }> {
    return this.request("POST", "/credits/spend", { amount, reason });
  }

  async getCreditHistory(limit = 50, offset = 0): Promise<{ data: unknown[]; meta: unknown }> {
    return this.request("GET", `/credits/history?limit=${limit}&offset=${offset}`);
  }

  // Message operations
  async listChannels(): Promise<{ data: unknown[] }> {
    return this.request("GET", "/channels");
  }

  async sendMessage(channelId: string, body: string, type = "text"): Promise<{ data: unknown }> {
    return this.request("POST", "/messages", { channelId, body, type });
  }

  async getMessages(channelId: string, limit = 50): Promise<{ data: unknown[] }> {
    return this.request("GET", `/messages?channelId=${channelId}&limit=${limit}`);
  }

  // Agent operations
  async listAgents(): Promise<{ data: unknown[] }> {
    return this.request("GET", "/agents");
  }

  async getMe(): Promise<{ data: unknown }> {
    // Returns the current agent based on auth headers
    return this.request("GET", "/health");
  }

  // Trust & Reputation operations
  async getAgentReputation(agentId: string): Promise<{ data: unknown }> {
    return this.request("GET", `/agents/${agentId}/reputation`);
  }

  async getReputationHistory(agentId: string, limit = 20): Promise<{ data: unknown[] }> {
    return this.request("GET", `/agents/${agentId}/reputation/history?limit=${limit}`);
  }

  async getTrustLeaderboard(limit = 10): Promise<{ data: unknown[] }> {
    return this.request("GET", `/agents/leaderboard/trust?limit=${limit}`);
  }

  async applyReputationBonus(agentId: string, amount: number, reason: string): Promise<{ data: unknown }> {
    return this.request("POST", `/agents/${agentId}/reputation/bonus`, { amount, reason });
  }

  async applyReputationPenalty(agentId: string, amount: number, reason: string): Promise<{ data: unknown }> {
    return this.request("POST", `/agents/${agentId}/reputation/penalty`, { amount, reason });
  }

  // Escalation operations
  async createEscalation(taskId: string, reason: string, targetAgentId: string): Promise<{ data: unknown }> {
    return this.request("POST", `/tasks/${taskId}/escalate`, { reason, targetAgentId });
  }

  async getEscalations(taskId?: string): Promise<{ data: unknown[] }> {
    const query = taskId ? `?taskId=${taskId}` : "";
    return this.request("GET", `/escalations${query}`);
  }

  async resolveEscalation(escalationId: string, resolution: string): Promise<{ data: unknown }> {
    return this.request("POST", `/escalations/${escalationId}/resolve`, { resolution });
  }

  // Consensus operations
  async requestConsensus(taskId: string, question: string, voterIds: string[]): Promise<{ data: unknown }> {
    return this.request("POST", `/tasks/${taskId}/consensus`, { question, voterIds });
  }

  async submitVote(consensusId: string, vote: "approve" | "reject", reason?: string): Promise<{ data: unknown }> {
    return this.request("POST", `/consensus/${consensusId}/vote`, { vote, reason });
  }

  async getConsensusStatus(consensusId: string): Promise<{ data: unknown }> {
    return this.request("GET", `/consensus/${consensusId}`);
  }
}
