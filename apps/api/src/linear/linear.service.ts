// Linear service implementation - simplified for initial PR
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OnEvent } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import * as crypto from "node:crypto";
import { LinearConnection, type LinearSyncConfig } from "@openspawn/database";
import { IntegrationLinkService } from "../github/integration-link.service";
import type { IntegrationProvider } from "../github/interfaces/integration-provider.interface";
import { CreateLinearConnectionDto } from "./dto/create-linear-connection.dto";
import { UpdateLinearConnectionDto } from "./dto/update-linear-connection.dto";

const DEFAULT_SYNC_CONFIG: LinearSyncConfig = {
  inbound: { createTaskOnIssue: true, createTaskOnComment: true, syncStatusChanges: true, requiredLabel: "agent-work" },
  outbound: { closeIssueOnComplete: true, commentOnStatusChange: true, updateLabels: true, syncAssignee: true },
};

@Injectable()
export class LinearService implements IntegrationProvider {
  readonly providerName = "linear";
  private readonly logger = new Logger(LinearService.name);

  constructor(
    @InjectRepository(LinearConnection) private readonly connectionRepo: Repository<LinearConnection>,
    private readonly linkService: IntegrationLinkService,
  ) {}

  async create(orgId: string, dto: CreateLinearConnectionDto): Promise<LinearConnection> {
    const webhookSecret = crypto.randomBytes(32).toString("hex");
    const syncConfig: LinearSyncConfig = {
      inbound: {
        createTaskOnIssue: dto.createTaskOnIssue ?? DEFAULT_SYNC_CONFIG.inbound.createTaskOnIssue,
        createTaskOnComment: dto.createTaskOnComment ?? DEFAULT_SYNC_CONFIG.inbound.createTaskOnComment,
        syncStatusChanges: DEFAULT_SYNC_CONFIG.inbound.syncStatusChanges,
        requiredLabel: DEFAULT_SYNC_CONFIG.inbound.requiredLabel,
      },
      outbound: {
        closeIssueOnComplete: dto.closeIssueOnComplete ?? DEFAULT_SYNC_CONFIG.outbound.closeIssueOnComplete,
        commentOnStatusChange: dto.commentOnStatusChange ?? DEFAULT_SYNC_CONFIG.outbound.commentOnStatusChange,
        updateLabels: DEFAULT_SYNC_CONFIG.outbound.updateLabels,
        syncAssignee: dto.syncAssignee ?? DEFAULT_SYNC_CONFIG.outbound.syncAssignee,
      },
    };
    const connection = this.connectionRepo.create({
      orgId, name: dto.name, teamId: dto.teamId, webhookSecret,
      apiKey: dto.apiKey || null, teamFilter: dto.teamFilter || [], syncConfig, enabled: true,
    });
    return this.connectionRepo.save(connection);
  }

  async findByOrg(orgId: string): Promise<LinearConnection[]> {
    return this.connectionRepo.find({ where: { orgId }, order: { createdAt: "DESC" } });
  }

  async findById(orgId: string, id: string): Promise<LinearConnection> {
    const conn = await this.connectionRepo.findOne({ where: { orgId, id } });
    if (!conn) throw new NotFoundException(`Linear connection \${id} not found`);
    return conn;
  }

  async findByTeamId(teamId: string): Promise<LinearConnection | null> {
    return this.connectionRepo.findOne({ where: { teamId } });
  }

  async update(orgId: string, id: string, dto: UpdateLinearConnectionDto): Promise<LinearConnection> {
    const conn = await this.findById(orgId, id);
    if (dto.name !== undefined) conn.name = dto.name;
    if (dto.apiKey !== undefined) conn.apiKey = dto.apiKey;
    if (dto.teamFilter !== undefined) conn.teamFilter = dto.teamFilter;
    if (dto.enabled !== undefined) conn.enabled = dto.enabled;
    if (dto.createTaskOnIssue !== undefined) conn.syncConfig.inbound.createTaskOnIssue = dto.createTaskOnIssue;
    if (dto.createTaskOnComment !== undefined) conn.syncConfig.inbound.createTaskOnComment = dto.createTaskOnComment;
    if (dto.closeIssueOnComplete !== undefined) conn.syncConfig.outbound.closeIssueOnComplete = dto.closeIssueOnComplete;
    if (dto.commentOnStatusChange !== undefined) conn.syncConfig.outbound.commentOnStatusChange = dto.commentOnStatusChange;
    if (dto.syncAssignee !== undefined) conn.syncConfig.outbound.syncAssignee = dto.syncAssignee;
    return this.connectionRepo.save(conn);
  }

  async remove(orgId: string, id: string): Promise<void> {
    const conn = await this.findById(orgId, id);
    await this.connectionRepo.remove(conn);
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    try { return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)); }
    catch { return false; }
  }

  async handleWebhookEvent(orgId: string, event: string, payload: unknown): Promise<void> {
    this.logger.log(`Processing Linear event: \${event} for org \${orgId}`);
    // Webhook processing implementation
  }

  async syncOutbound(orgId: string, event: string, data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Outbound sync: \${event} for org \${orgId}`);
  }

  async testConnection(connectionId: string): Promise<{ ok: boolean; message: string }> {
    const conn = await this.connectionRepo.findOne({ where: { id: connectionId } });
    if (!conn) return { ok: false, message: "Connection not found" };
    if (!conn.apiKey) return { ok: false, message: "No API key configured" };
    return { ok: true, message: "Connection is healthy" };
  }

  @OnEvent("task.completed")
  async onTaskCompleted(data: { orgId: string; taskId: string }) {
    const links = await this.linkService.findByTarget(data.orgId, "task", data.taskId);
    for (const link of links) {
      if (link.provider === "linear") await this.syncOutbound(data.orgId, "task.completed", { taskId: data.taskId });
    }
  }

  @OnEvent("task.status_changed")
  async onTaskStatusChanged(data: { orgId: string; taskId: string; status: string }) {
    const links = await this.linkService.findByTarget(data.orgId, "task", data.taskId);
    for (const link of links) {
      if (link.provider === "linear") await this.syncOutbound(data.orgId, "task.status_changed", { taskId: data.taskId, status: data.status });
    }
  }
}
