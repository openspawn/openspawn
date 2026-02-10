import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OnEvent } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import * as crypto from "node:crypto";

import { GitHubConnection, type GitHubSyncConfig } from "@openspawn/database";

import { IntegrationLinkService } from "./integration-link.service";
import type { IntegrationProvider } from "./interfaces/integration-provider.interface";
import { CreateGitHubConnectionDto } from "./dto/create-github-connection.dto";
import { UpdateGitHubConnectionDto } from "./dto/update-github-connection.dto";

const DEFAULT_SYNC_CONFIG: GitHubSyncConfig = {
  inbound: {
    createTaskOnIssue: true,
    createTaskOnPR: true,
    createTaskOnCheckFailure: true,
    requiredLabel: "agent-work",
  },
  outbound: {
    closeIssueOnComplete: true,
    commentOnStatusChange: true,
    updateLabels: true,
  },
};

@Injectable()
export class GitHubService implements IntegrationProvider {
  readonly providerName = "github";
  private readonly logger = new Logger(GitHubService.name);

  constructor(
    @InjectRepository(GitHubConnection)
    private readonly connectionRepo: Repository<GitHubConnection>,
    private readonly linkService: IntegrationLinkService,
  ) {}

  // ── Connection CRUD ──────────────────────────────────────────────

  async create(orgId: string, dto: CreateGitHubConnectionDto): Promise<GitHubConnection> {
    const webhookSecret = crypto.randomBytes(32).toString("hex");

    const syncConfig: GitHubSyncConfig = {
      inbound: {
        createTaskOnIssue: dto.createTaskOnIssue ?? DEFAULT_SYNC_CONFIG.inbound.createTaskOnIssue,
        createTaskOnPR: dto.createTaskOnPR ?? DEFAULT_SYNC_CONFIG.inbound.createTaskOnPR,
        createTaskOnCheckFailure: DEFAULT_SYNC_CONFIG.inbound.createTaskOnCheckFailure,
        requiredLabel: DEFAULT_SYNC_CONFIG.inbound.requiredLabel,
      },
      outbound: {
        closeIssueOnComplete:
          dto.closeIssueOnComplete ?? DEFAULT_SYNC_CONFIG.outbound.closeIssueOnComplete,
        commentOnStatusChange:
          dto.commentOnStatusChange ?? DEFAULT_SYNC_CONFIG.outbound.commentOnStatusChange,
        updateLabels: DEFAULT_SYNC_CONFIG.outbound.updateLabels,
      },
    };

    const connection = this.connectionRepo.create({
      orgId,
      name: dto.name,
      installationId: dto.installationId,
      webhookSecret,
      accessToken: dto.accessToken || null,
      repoFilter: dto.repoFilter || [],
      syncConfig,
      enabled: true,
    });

    return this.connectionRepo.save(connection);
  }

  async findByOrg(orgId: string): Promise<GitHubConnection[]> {
    return this.connectionRepo.find({
      where: { orgId },
      order: { createdAt: "DESC" },
    });
  }

  async findById(orgId: string, id: string): Promise<GitHubConnection> {
    const conn = await this.connectionRepo.findOne({ where: { orgId, id } });
    if (!conn) throw new NotFoundException(`GitHub connection ${id} not found`);
    return conn;
  }

  async findByInstallationId(installationId: string): Promise<GitHubConnection | null> {
    return this.connectionRepo.findOne({ where: { installationId } });
  }

  async update(
    orgId: string,
    id: string,
    dto: UpdateGitHubConnectionDto,
  ): Promise<GitHubConnection> {
    const conn = await this.findById(orgId, id);

    if (dto.name !== undefined) conn.name = dto.name;
    if (dto.accessToken !== undefined) conn.accessToken = dto.accessToken;
    if (dto.repoFilter !== undefined) conn.repoFilter = dto.repoFilter;
    if (dto.enabled !== undefined) conn.enabled = dto.enabled;

    // Update sync config fields individually
    if (dto.createTaskOnIssue !== undefined)
      conn.syncConfig.inbound.createTaskOnIssue = dto.createTaskOnIssue;
    if (dto.createTaskOnPR !== undefined)
      conn.syncConfig.inbound.createTaskOnPR = dto.createTaskOnPR;
    if (dto.closeIssueOnComplete !== undefined)
      conn.syncConfig.outbound.closeIssueOnComplete = dto.closeIssueOnComplete;
    if (dto.commentOnStatusChange !== undefined)
      conn.syncConfig.outbound.commentOnStatusChange = dto.commentOnStatusChange;

    return this.connectionRepo.save(conn);
  }

  async remove(orgId: string, id: string): Promise<void> {
    const conn = await this.findById(orgId, id);
    await this.connectionRepo.remove(conn);
  }

  // ── Webhook Signature Verification ───────────────────────────────

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expected = "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  // ── Inbound Webhook Processing ───────────────────────────────────

  async handleWebhookEvent(orgId: string, event: string, payload: unknown): Promise<void> {
    const body = payload as Record<string, any>;
    this.logger.log(`Processing GitHub event: ${event} for org ${orgId}`);

    switch (event) {
      case "issues":
        await this.handleIssueEvent(orgId, body);
        break;
      case "issue_comment":
        await this.handleIssueCommentEvent(orgId, body);
        break;
      case "pull_request":
        await this.handlePullRequestEvent(orgId, body);
        break;
      case "check_suite":
        await this.handleCheckSuiteEvent(orgId, body);
        break;
      default:
        this.logger.debug(`Unhandled GitHub event: ${event}`);
    }
  }

  private async handleIssueEvent(orgId: string, payload: Record<string, any>): Promise<void> {
    const { action, issue } = payload;
    const issueId = String(issue?.number);

    if (action === "opened" || action === "labeled") {
      const labels: string[] = (issue?.labels || []).map((l: any) => l.name);
      if (labels.includes("agent-work")) {
        // Check if link already exists
        const existing = await this.linkService.findBySource(orgId, "github_issue", issueId);
        if (!existing) {
          this.logger.log(`Creating task for GitHub issue #${issueId}`);
          // Task creation would be handled by the event emitter in a real setup
          // For now, create the integration link placeholder
          await this.linkService.createLink({
            orgId,
            provider: "github",
            sourceType: "github_issue",
            sourceId: issueId,
            targetType: "task",
            targetId: "00000000-0000-0000-0000-000000000000", // placeholder
            metadata: {
              title: issue?.title,
              body: issue?.body,
              url: issue?.html_url,
              action,
              labels,
              repo: payload.repository?.full_name,
            },
          });
        }
      }
    } else if (action === "closed") {
      const link = await this.linkService.findBySource(orgId, "github_issue", issueId);
      if (link) {
        link.metadata = { ...link.metadata, closed: true, closedAt: new Date().toISOString() };
        this.logger.log(`Issue #${issueId} closed, linked task: ${link.targetId}`);
      }
    }
  }

  private async handleIssueCommentEvent(
    orgId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const { action, comment, issue } = payload;
    if (action !== "created") return;

    const issueId = String(issue?.number);
    const link = await this.linkService.findBySource(orgId, "github_issue", issueId);
    if (link) {
      await this.linkService.createLink({
        orgId,
        provider: "github",
        sourceType: "github_comment",
        sourceId: String(comment?.id),
        targetType: "message",
        targetId: "00000000-0000-0000-0000-000000000000",
        metadata: {
          body: comment?.body,
          author: comment?.user?.login,
          issueNumber: issueId,
          url: comment?.html_url,
        },
      });
    }
  }

  private async handlePullRequestEvent(
    orgId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const { action, pull_request } = payload;
    if (action !== "opened") return;

    const prId = String(pull_request?.number);
    this.logger.log(`Creating review task for PR #${prId}`);

    await this.linkService.createLink({
      orgId,
      provider: "github",
      sourceType: "github_pr",
      sourceId: prId,
      targetType: "task",
      targetId: "00000000-0000-0000-0000-000000000000",
      metadata: {
        title: pull_request?.title,
        body: pull_request?.body,
        url: pull_request?.html_url,
        author: pull_request?.user?.login,
        repo: payload.repository?.full_name,
      },
    });
  }

  private async handleCheckSuiteEvent(
    orgId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const { action, check_suite } = payload;
    if (action !== "completed" || check_suite?.conclusion !== "failure") return;

    this.logger.log(`Check suite failed, creating fix task`);
    await this.linkService.createLink({
      orgId,
      provider: "github",
      sourceType: "github_pr",
      sourceId: `check-${check_suite?.id}`,
      targetType: "task",
      targetId: "00000000-0000-0000-0000-000000000000",
      metadata: {
        checkSuiteId: check_suite?.id,
        conclusion: check_suite?.conclusion,
        repo: payload.repository?.full_name,
        branch: check_suite?.head_branch,
      },
    });
  }

  // ── Outbound Sync ────────────────────────────────────────────────

  async syncOutbound(orgId: string, event: string, data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Outbound sync: ${event} for org ${orgId}`);
    // In production, this would call the GitHub API
    // For now, log the intent
    switch (event) {
      case "task.completed":
        this.logger.log(`Would close GitHub issue for completed task ${data.taskId}`);
        break;
      case "task.status_changed":
        this.logger.log(`Would update labels for task ${data.taskId} → ${data.status}`);
        break;
      case "message.created":
        this.logger.log(`Would post comment for message on task ${data.taskId}`);
        break;
    }
  }

  async testConnection(connectionId: string): Promise<{ ok: boolean; message: string }> {
    const conn = await this.connectionRepo.findOne({ where: { id: connectionId } });
    if (!conn) return { ok: false, message: "Connection not found" };
    if (!conn.accessToken) return { ok: false, message: "No access token configured" };
    // In production, would test GitHub API connectivity
    return { ok: true, message: "Connection is healthy" };
  }

  // ── Event Listeners (Outbound) ───────────────────────────────────

  @OnEvent("task.completed")
  async onTaskCompleted(data: { orgId: string; taskId: string }) {
    const links = await this.linkService.findByTarget(data.orgId, "task", data.taskId);
    for (const link of links) {
      if (link.provider === "github") {
        await this.syncOutbound(data.orgId, "task.completed", { taskId: data.taskId });
      }
    }
  }

  @OnEvent("task.status_changed")
  async onTaskStatusChanged(data: { orgId: string; taskId: string; status: string }) {
    const links = await this.linkService.findByTarget(data.orgId, "task", data.taskId);
    for (const link of links) {
      if (link.provider === "github") {
        await this.syncOutbound(data.orgId, "task.status_changed", {
          taskId: data.taskId,
          status: data.status,
        });
      }
    }
  }

  @OnEvent("message.created")
  async onMessageCreated(data: { orgId: string; messageId: string; taskId?: string }) {
    if (!data.taskId) return;
    const links = await this.linkService.findByTarget(data.orgId, "task", data.taskId);
    for (const link of links) {
      if (link.provider === "github") {
        await this.syncOutbound(data.orgId, "message.created", {
          taskId: data.taskId,
          messageId: data.messageId,
        });
      }
    }
  }
}
