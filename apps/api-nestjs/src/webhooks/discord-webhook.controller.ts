import { Controller, Post, Body, Logger, HttpCode } from "@nestjs/common";
import { Public } from "../auth";
import { TasksService } from "../tasks/tasks.service";
import { AgentsService } from "../agents/agents.service";
import { TaskPriority, TaskStatus } from "@openspawn/shared-types";

interface DiscordMessage {
  id: string;
  channel_id: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    bot?: boolean;
  };
  content: string;
  timestamp: string;
}

const ORG_ID = "f3a3fc0c-29e6-4d0d-b489-3c065d9230b6";
const DENNIS_ID = "1e16745a-d6c7-467d-a6b2-fc87ad63a852";
const CEO_ID = "ab985264-ec8f-49de-80d9-ad357e119be9";

// Map Discord users to agent database IDs
const DISCORD_AGENT_MAP: Record<string, string> = {
  "1476208320607027220": DENNIS_ID,
  "1476211154756833452": CEO_ID,
};

@Controller("webhooks/discord")
export class DiscordWebhookController {
  private readonly logger = new Logger(DiscordWebhookController.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly agentsService: AgentsService,
  ) {}

  @Public()
  @Post()
  @HttpCode(204)
  async handleDiscordMessage(@Body() payload: DiscordMessage) {
    try {
      if (payload.author.bot && !DISCORD_AGENT_MAP[payload.author.id]) {
        return;
      }

      const content = payload.content;
      const creatorId = DISCORD_AGENT_MAP[payload.author.id];

      this.logger.log(`Discord: ${payload.author.username} - ${content.slice(0, 60)}...`);

      // Task creation
      const taskCreated = content.match(
        /(?:✅\s*Task:|Created task:|Task created:)\s*(.+?)(?:\n|$)/i,
      );
      if (taskCreated && creatorId) {
        await this.createTask(taskCreated[1].trim(), creatorId, content);
        return;
      }

      // Task completion
      const taskComplete = content.match(
        /(?:✅|Completed:|Done:)\s*(.+?)(?:complete|finished|done)/i,
      );
      if (taskComplete && creatorId) {
        await this.markTaskComplete(taskComplete[1].trim(), creatorId);
        return;
      }
    } catch (error: unknown) {
      this.logger.error("Discord webhook error:", error);
    }
  }

  private async createTask(title: string, creatorId: string, fullMessage: string) {
    try {
      let priority: TaskPriority = TaskPriority.NORMAL;
      if (fullMessage.match(/critical|urgent|asap/i)) priority = TaskPriority.URGENT;
      else if (fullMessage.match(/high priority|important/i)) priority = TaskPriority.HIGH;
      else if (fullMessage.match(/low priority/i)) priority = TaskPriority.LOW;

      const task = await this.tasksService.create(ORG_ID, creatorId, {
        title: title.slice(0, 500),
        description: fullMessage.slice(0, 2000),
        priority,
      });

      this.logger.log(`✅ Task created: ${task.identifier} - ${task.title}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Task creation failed: ${msg}`);
    }
  }

  private async markTaskComplete(titleHint: string, actorId: string) {
    try {
      const tasks = await this.tasksService.findAll(ORG_ID);
      const match = tasks.find(
        (t) =>
          t.title.toLowerCase().includes(titleHint.toLowerCase()) && t.status !== TaskStatus.DONE,
      );

      if (match) {
        await this.tasksService.transition(ORG_ID, actorId, match.id, { status: TaskStatus.DONE });
        this.logger.log(`✅ Task done: ${match.identifier}`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Task completion failed: ${msg}`);
    }
  }
}
