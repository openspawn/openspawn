import {
  AgentRole,
  AgentStatus,
  CreditType,
  EventSeverity,
  TaskPriority,
} from "@openspawn/shared-types";
import type { DemoScenario, DemoAgent, DemoTask, DemoCreditTransaction, DemoEvent } from "../types";
import { agents, AGENT_IDS, generateRandomAgent } from "../fixtures/agents";
import { tasks, generateRandomTask } from "../fixtures/tasks";
import { creditTransactions, generateCreditTransaction } from "../fixtures/credits";
import { events, generateEvent } from "../fixtures/events";
import { generateInitialMessages } from "../fixtures/messages";
import { demoWebhooks } from "../fixtures/webhooks";

// Additional domains for enterprise scale
const ENTERPRISE_DOMAINS = [
  "Engineering",
  "Finance",
  "Marketing",
  "Sales",
  "Support",
  "Research",
  "Legal",
  "HR",
];

// Generate additional agents for enterprise scale
function generateEnterpriseAgents(): DemoAgent[] {
  const extraAgents: DemoAgent[] = [];

  // Add more talent agents
  const talentAgentNames = [
    "Support Talent Agent",
    "Research Talent Agent",
    "Legal Talent Agent",
    "People Talent Agent",
  ];
  const talentDomains = ["Support", "Research", "Legal", "HR"];

  talentAgentNames.forEach((name, i) => {
    extraAgents.push(
      generateRandomAgent({
        name,
        role: AgentRole.HR,
        level: 9,
        status: AgentStatus.ACTIVE,
        model: i % 2 === 0 ? "claude-sonnet-4" : "gpt-4o",
        currentBalance: 8000 + Math.floor(Math.random() * 5000),
        lifetimeEarnings: 20000 + Math.floor(Math.random() * 15000),
        parentId: AGENT_IDS.agentDennis,
        domain: talentDomains[i],
      }),
    );
  });

  // Add more seniors (2 per domain)
  ENTERPRISE_DOMAINS.forEach((domain) => {
    for (let i = 0; i < 2; i++) {
      extraAgents.push(
        generateRandomAgent({
          name: `${domain} Senior ${i + 1}`,
          role: AgentRole.SENIOR,
          level: 5 + Math.floor(Math.random() * 2),
          status: Math.random() > 0.9 ? AgentStatus.PAUSED : AgentStatus.ACTIVE,
          model: Math.random() > 0.5 ? "claude-sonnet-4" : "gpt-4o",
          currentBalance: 1500 + Math.floor(Math.random() * 2000),
          lifetimeEarnings: 8000 + Math.floor(Math.random() * 8000),
          domain,
        }),
      );
    }
  });

  // Add more workers (3 per domain)
  ENTERPRISE_DOMAINS.forEach((domain) => {
    for (let i = 0; i < 3; i++) {
      extraAgents.push(
        generateRandomAgent({
          name: `${domain} Worker ${i + 1}`,
          role: AgentRole.WORKER,
          level: 2 + Math.floor(Math.random() * 3),
          status: Math.random() > 0.85 ? AgentStatus.PENDING : AgentStatus.ACTIVE,
          model: "gpt-4o-mini",
          currentBalance: 500 + Math.floor(Math.random() * 1500),
          lifetimeEarnings: 2000 + Math.floor(Math.random() * 5000),
          domain,
        }),
      );
    }
  });

  return extraAgents;
}

// Generate more tasks
function generateEnterpriseTasks(): DemoTask[] {
  const extraTasks: DemoTask[] = [];
  const taskTemplates = [
    { title: "Review documentation", priority: TaskPriority.NORMAL },
    { title: "Fix critical bug", priority: TaskPriority.CRITICAL },
    { title: "Implement feature", priority: TaskPriority.HIGH },
    { title: "Write tests", priority: TaskPriority.NORMAL },
    { title: "Performance optimization", priority: TaskPriority.HIGH },
    { title: "Security audit", priority: TaskPriority.CRITICAL },
    { title: "User research", priority: TaskPriority.NORMAL },
    { title: "Create report", priority: TaskPriority.LOW },
  ];

  for (let i = 0; i < 40; i++) {
    const template = taskTemplates[i % taskTemplates.length];
    extraTasks.push(
      generateRandomTask({
        title: `${template.title} #${i + 100}`,
        priority: template.priority,
      }),
    );
  }

  return extraTasks;
}

// Generate enterprise-scale credit activity
function generateEnterpriseCredits(enterpriseAgents: DemoAgent[]): DemoCreditTransaction[] {
  const extraCredits: DemoCreditTransaction[] = [];

  enterpriseAgents.forEach((agent) => {
    // Initial allocation
    extraCredits.push(
      generateCreditTransaction(
        agent.id,
        CreditType.CREDIT,
        agent.currentBalance + 1000,
        `Initial budget for ${agent.name}`,
      ),
    );

    // Some usage
    if (Math.random() > 0.3) {
      extraCredits.push(
        generateCreditTransaction(
          agent.id,
          CreditType.DEBIT,
          Math.floor(Math.random() * 100),
          "Model usage",
        ),
      );
    }
  });

  return extraCredits;
}

// Generate enterprise events
function generateEnterpriseEvents(enterpriseAgents: DemoAgent[]): DemoEvent[] {
  const extraEvents: DemoEvent[] = [];

  enterpriseAgents.forEach((agent) => {
    extraEvents.push(
      generateEvent("agent.created", EventSeverity.INFO, `${agent.name} joined the organization`, {
        agentId: agent.id,
        metadata: { level: agent.level, domain: agent.domain },
      }),
    );
  });

  return extraEvents;
}

// Build the enterprise scenario
const enterpriseAgents = generateEnterpriseAgents();
const enterpriseTasks = generateEnterpriseTasks();
const enterpriseCredits = generateEnterpriseCredits(enterpriseAgents);
const enterpriseEvents = generateEnterpriseEvents(enterpriseAgents);

// Build combined agent and task lists
const allEnterpriseAgents = [...agents, ...enterpriseAgents];
const allEnterpriseTasks = [...tasks, ...enterpriseTasks];

/**
 * Enterprise Scenario: Large organization
 * - 50+ agents across 8 domains
 * - 50+ tasks in various stages
 * - Complex credit economy with transfers
 */
export const enterpriseScenario: DemoScenario = {
  name: "enterprise",
  description: "Large organization - 50+ agents, 8 domains, complex hierarchy",
  agents: allEnterpriseAgents,
  tasks: allEnterpriseTasks,
  credits: [...creditTransactions, ...enterpriseCredits],
  events: [...events, ...enterpriseEvents],
  messages: generateInitialMessages(
    allEnterpriseAgents.map((a) => a.id),
    allEnterpriseTasks.map((t) => t.identifier),
  ),
  webhooks: demoWebhooks,
};

export default enterpriseScenario;
