// Auto-generated LLM Recording Replay Data
// Source: tools/sandbox/scenarios/recorded/2026-02-17T01-17-49-llm-simulation.md | Model: meta-llama/llama-4-scout-17b-16e-instruct
// 387 decisions, 48 ticks, 53/191 tasks

import type { ReplayEvent } from "./replay-data";

export const LLM_ACTS = [
  {
    num: 1,
    name: "Act I: Order Received",
    narrative: "Mr. Krabs receives the 10K patty order and begins delegation.",
  },
  {
    num: 2,
    name: "Act II: Organization",
    narrative: "Leads assigned. The org structure takes shape.",
  },
  {
    num: 3,
    name: "Act III: Full Production",
    narrative: "All 9 agents working. Tasks flow through the hierarchy.",
  },
  {
    num: 4,
    name: "Act IV: Crunch Time",
    narrative: "Delegation intensifies. 387 decisions, 191 tasks created.",
  },
  {
    num: 5,
    name: "Act V: Results",
    narrative: "53/191 tasks completed. LLM coordination at scale.",
  },
] as const;

export const LLM_METADATA = {
  model: "meta-llama/llama-4-scout-17b-16e-instruct",
  recorded: "2026-02-17T01:00:26.688Z",
  ticks: 48,
  decisions: 387,
  agents: 9,
  tasksDone: 53,
  tasksTotal: 191,
  completionRate: "28%",
  avgLatencyMs: 357,
};

export const LLM_MAX_TICK = 120;
export const LLM_TARGET = 191;
export const LLM_DELIVERED = 53;

export const LLM_TIMELINE: ReplayEvent[] = [
  {
    tick: 0,
    type: "act_change",
    data: {
      act: 0,
    },
  },
  {
    tick: 0,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 0,
        queueSize: 0,
        deliveryRate: 0,
        revenue: 0,
        margin: 3.5,
        budgetUsed: 0,
        pattiesProduced: 0,
        pattiesDelivered: 0,
      },
    },
  },
  {
    tick: 1,
    type: "message",
    data: {
      from: "mr-krabs",
      text: "💤 I'm waiting for tasks or team members to arrive.",
    },
  },
  {
    tick: 1,
    type: "node_status",
    data: {
      agent: "mr-krabs",
      status: "working",
    },
  },
  {
    tick: 3,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob: SpongeBob, I need you to create a production plan for 10,000 Krabby Patties. This is a critical task to ensure we meet t",
    },
  },
  {
    tick: 5,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob: SpongeBob, I need you to create a production plan for 10,000 Krabby Patties. This is a critical task. Please review the ",
    },
  },
  {
    tick: 5,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "plankton-jr",
      text: "📋 Sandy Cheeks → Plankton Jr.: Assigned receiving order task to Plankton Jr. to free up bandwidth for high-priority tasks.",
    },
  },
  {
    tick: 5,
    type: "message",
    data: {
      from: "karen",
      text: "🔨 I am starting to validate the order for 10,000 Krabby Patties as it is critical and has no assignee.",
    },
  },
  {
    tick: 5,
    type: "node_status",
    data: {
      agent: "sandy-cheeks",
      status: "working",
    },
  },
  {
    tick: 5,
    type: "node_status",
    data: {
      agent: "karen",
      status: "working",
    },
  },
  {
    tick: 8,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob: SpongeBob, I need you to create a production plan for 10,000 Krabby Patties. This is a critical task to ensure we meet t",
    },
  },
  {
    tick: 8,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "plankton-jr",
      text: "📋 Sandy Cheeks → Plankton Jr.: Assigning payment verification task to Plankton Jr. to free up bandwidth for critical tasks.",
    },
  },
  {
    tick: 8,
    type: "message",
    data: {
      from: "karen",
      text: "🔨 I'm starting with TASK-1001 to validate the order of 10,000 Krabby Patties, as it's marked critical and needs immediate ",
    },
  },
  {
    tick: 8,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 1,
        queueSize: 9,
        deliveryRate: 0,
        revenue: 3333,
        margin: 3.5,
        budgetUsed: 6,
        pattiesProduced: 12,
        pattiesDelivered: 3,
      },
    },
  },
  {
    tick: 10,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob: SpongeBob, I need you to create a production plan for 10,000 Krabby Patties. This is a critical task to ensure we meet t",
    },
  },
  {
    tick: 10,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "plankton-jr",
      text: "📋 Sandy Cheeks → Plankton Jr.: Assigned critical task to Plankton Jr. to validate the large order of 10,000 Krabby Patties, ensuring accuracy before pr",
    },
  },
  {
    tick: 10,
    type: "delegation",
    data: {
      from: "barnacle-boy",
      to: "fred-2",
      text: "📋 Barnacle Boy → fred-2: Delegating critical task to validate production plan to Fred 2 to free up capacity for other critical tasks.",
    },
  },
  {
    tick: 10,
    type: "node_status",
    data: {
      agent: "barnacle-boy",
      status: "working",
    },
  },
  {
    tick: 13,
    type: "act_change",
    data: {
      act: 1,
    },
  },
  {
    tick: 13,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob: SpongeBob, I need you to break down the 10,000 Krabby Patties order into manageable batches for the kitchen. This is a t",
    },
  },
  {
    tick: 13,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "patrick-star",
      text: "📋 Sandy Cheeks → Patrick Star: Assigning batch decomposition task to Patrick for execution",
    },
  },
  {
    tick: 13,
    type: "delegation",
    data: {
      from: "barnacle-boy",
      to: "fred-3",
      text: "📋 Barnacle Boy → Fred 3: Assigning critical task to brief SpongeBob on order magnitude to Fred 3 to ensure timely communication.",
    },
  },
  {
    tick: 15,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob: SpongeBob, I need you to brief on the 10,000 Krabby Patties order. It's a massive task, and I need you to understand the",
    },
  },
  {
    tick: 15,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "patrick-star",
      text: "📋 Sandy Cheeks → Patrick Star: Assigning critical task to Patrick for batch execution.",
    },
  },
  {
    tick: 15,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "perch-perkins",
      text: "📋 Squidward Tentacles → Perch Perkins: I'm assigning Perch Perkins to validate the massive order of 10,000 Krabby Patties, as it's critical and requires immedi",
    },
  },
  {
    tick: 15,
    type: "node_status",
    data: {
      agent: "squidward-tentacles",
      status: "working",
    },
  },
  {
    tick: 15,
    type: "node_status",
    data: {
      agent: "perch-perkins",
      status: "working",
    },
  },
  {
    tick: 16,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 2,
        queueSize: 18,
        deliveryRate: 1,
        revenue: 6666,
        margin: 3.6,
        budgetUsed: 12,
        pattiesProduced: 25,
        pattiesDelivered: 7,
      },
    },
  },
  {
    tick: 18,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: SpongeBob, I need you to break down the large order into manageable batches for the kitchen. This will help us meet the ",
    },
  },
  {
    tick: 18,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "patrick-star",
      text: "📋 Sandy Cheeks → Patrick Star: Patrick, I need you to review the pipeline architecture for the 10,000 Krabby Patties order. This will help us identify ",
    },
  },
  {
    tick: 18,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Assigned TASK-1009 to Mermaid Man to free up capacity for high-priority tasks",
    },
  },
  {
    tick: 20,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: SpongeBob, I need you to verify the payment for the large order. Ensure it's legitimate and update the financial records",
    },
  },
  {
    tick: 20,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "patrick-star",
      text: "📋 Sandy Cheeks → Patrick Star: Patrick, I need you to take over verifying the payment for the 10,000 Krabby Patties order. This is a critical task that",
    },
  },
  {
    tick: 20,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Assigning critical task to verify payment to ensure timely processing.",
    },
  },
  {
    tick: 20,
    type: "node_status",
    data: {
      agent: "pearl-krabs",
      status: "working",
    },
  },
  {
    tick: 20,
    type: "node_status",
    data: {
      agent: "squilliam-fancyson",
      status: "working",
    },
  },
  {
    tick: 23,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: Assigning high-priority task to review and approve large order, ensuring maximum profitability for The Krusty Krab.",
    },
  },
  {
    tick: 23,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "patrick-star",
      text: "📋 Sandy Cheeks → Patrick Star: Assigning critical task to Patrick for execution, as it requires his attention to detail and negotiation skills with Mr.",
    },
  },
  {
    tick: 23,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Assigning critical task to Mermaid Man to progress on high-priority tasks.",
    },
  },
  {
    tick: 24,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 4,
        queueSize: 28,
        deliveryRate: 2,
        revenue: 10000,
        margin: 3.6,
        budgetUsed: 19,
        pattiesProduced: 38,
        pattiesDelivered: 10,
      },
    },
  },
  {
    tick: 25,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: Assigning critical task to ensure efficient kitchen operations and maximize profits.",
    },
  },
  {
    tick: 25,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, I need you to review the pipeline architecture to ensure it's optimized for the large order. This will help us me",
    },
  },
  {
    tick: 25,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to brief SpongeBob on order magnitude",
    },
  },
  {
    tick: 25,
    type: "node_status",
    data: {
      agent: "spongebob-squarepants",
      status: "working",
    },
  },
  {
    tick: 28,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: Assigning critical delivery planning task to Squidward to oversee logistics and ensure timely execution.",
    },
  },
  {
    tick: 28,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, I need you to review the pipeline architecture to ensure it's optimized for the increased order volume. This will",
    },
  },
  {
    tick: 28,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity for high-priority tasks.",
    },
  },
  {
    tick: 30,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: Delegate financial task to optimize resource allocation and focus on high-priority kitchen tasks",
    },
  },
  {
    tick: 30,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, I need you to review the pipeline architecture ASAP. This is critical to ensuring our kitchen operations run smoo",
    },
  },
  {
    tick: 30,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity for high-priority tasks.",
    },
  },
  {
    tick: 32,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 5,
        queueSize: 36,
        deliveryRate: 3,
        revenue: 13333,
        margin: 3.6,
        budgetUsed: 25,
        pattiesProduced: 50,
        pattiesDelivered: 14,
      },
    },
  },
  {
    tick: 33,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: SpongeBob, I need you to review the pipeline architecture with Sandy. This task is critical and requires your attention.",
    },
  },
  {
    tick: 33,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, I need you to review the pipeline architecture ASAP. This task is critical and will help us optimize our kitchen ",
    },
  },
  {
    tick: 33,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity",
    },
  },
  {
    tick: 35,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: SpongeBob, I need you to calculate the ingredient costs per batch ASAP. This will help us track our expenses and ensure ",
    },
  },
  {
    tick: 35,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, I need you to review the pipeline architecture ASAP. This will help us optimize our workflow and ensure we're mee",
    },
  },
  {
    tick: 35,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating high-priority task to free up capacity for critical tasks",
    },
  },
  {
    tick: 38,
    type: "act_change",
    data: {
      act: 2,
    },
  },
  {
    tick: 38,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: Assigning high-priority task to SpongeBob to track profits and losses, ensuring we stay financially afloat while handlin",
    },
  },
  {
    tick: 38,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, I need you to review the pipeline architecture ASAP. This will help us optimize our kitchen workflow and ensure w",
    },
  },
  {
    tick: 38,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating TASK-1014 to Mermaid Man to free up capacity for critical tasks.",
    },
  },
  {
    tick: 40,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: Assigning high-priority task to SpongeBob to optimize kitchen operations and control costs.",
    },
  },
  {
    tick: 40,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this critical task to Sandy, who has expertise in pipeline architecture, to optimize our kitchen workflow",
    },
  },
  {
    tick: 40,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity, as Mermaid Man has 9 tasks ongoing and can handle more.",
    },
  },
  {
    tick: 40,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 6,
        queueSize: 46,
        deliveryRate: 4,
        revenue: 16666,
        margin: 3.7,
        budgetUsed: 31,
        pattiesProduced: 63,
        pattiesDelivered: 17,
      },
    },
  },
  {
    tick: 43,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to ensure timely financial tracking and cost management.",
    },
  },
  {
    tick: 43,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this high-priority task to Sandy to ensure timely financial tracking and cost management, as I have multi",
    },
  },
  {
    tick: 43,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Assigning critical task to free up bandwidth for delivery planning.",
    },
  },
  {
    tick: 45,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to free up my time for strategic decisions and cost control.",
    },
  },
  {
    tick: 45,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this critical task to Sandy to ensure our pipeline architecture is reviewed and optimized for efficient t",
    },
  },
  {
    tick: 45,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity for high-priority reviews.",
    },
  },
  {
    tick: 48,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to ensure timely initialization of P&L tracking, allowing us to moni",
    },
  },
  {
    tick: 48,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this high-priority task to Sandy to ensure timely calculation of ingredient costs, allowing us to optimiz",
    },
  },
  {
    tick: 48,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity.",
    },
  },
  {
    tick: 48,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 8,
        queueSize: 55,
        deliveryRate: 4,
        revenue: 20000,
        margin: 3.7,
        budgetUsed: 38,
        pattiesProduced: 76,
        pattiesDelivered: 21,
      },
    },
  },
  {
    tick: 50,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to free up my time for strategic decisions and cost control.",
    },
  },
  {
    tick: 50,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity for other tasks.",
    },
  },
  {
    tick: 50,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on estimating our delivery capacity. We need to ensure we can handle the current volume of or",
    },
  },
  {
    tick: 53,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to free up bandwidth for other critical tasks, and to utilize his av",
    },
  },
  {
    tick: 53,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this high-priority task to Sandy to utilize her expertise in pipeline design and complex problems, ensuri",
    },
  },
  {
    tick: 53,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on calculating the ingredient costs per batch. This will help us optimize our inventory manag",
    },
  },
  {
    tick: 55,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: Squidward, I need you to brief Squidward on the delivery requirements for the large order. This is critical to ensure ti",
    },
  },
  {
    tick: 55,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating high-priority task to free up capacity",
    },
  },
  {
    tick: 55,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to estimate our delivery capacity. We're getting overwhelmed with orders and I need to know how much w",
    },
  },
  {
    tick: 56,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 9,
        queueSize: 65,
        deliveryRate: 5,
        revenue: 23333,
        margin: 3.7,
        budgetUsed: 44,
        pattiesProduced: 89,
        pattiesDelivered: 24,
      },
    },
  },
  {
    tick: 58,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to free up capacity for other tasks and ensure timely completion.",
    },
  },
  {
    tick: 58,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: '📋 SpongeBob SquarePants → sandy-cheeks: I\'m delegating TASK-1014 "Calculate ingredient costs per batch" to Sandy to help with inventory management and cost trac',
    },
  },
  {
    tick: 58,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity, ensuring delivery plan is progressed.",
    },
  },
  {
    tick: 60,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: SpongeBob, I need you to take the lead on initializing our P&L tracking. This is high-priority, and I want to make sure ",
    },
  },
  {
    tick: 60,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on estimating our delivery capacity. We need to ensure we can handle the current volume of or",
    },
  },
  {
    tick: 60,
    type: "delegation",
    data: {
      from: "squilliam-fancyson",
      to: "plankton",
      text: "📋 Squilliam Fancyson → Plankton: Assigning critical task to free up capacity. Plankton, please take on TASK-1012 to estimate delivery capacity.",
    },
  },
  {
    tick: 63,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to free up capacity for other tasks and ensure timely completion.",
    },
  },
  {
    tick: 63,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating the high-priority task of initializing P&L tracking to Sandy Cheeks, as it's a critical task that require",
    },
  },
  {
    tick: 63,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on estimating our delivery capacity. We need to ensure we can handle the current volume of or",
    },
  },
  {
    tick: 64,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 10,
        queueSize: 73,
        deliveryRate: 6,
        revenue: 26666,
        margin: 3.8,
        budgetUsed: 50,
        pattiesProduced: 101,
        pattiesDelivered: 28,
      },
    },
  },
  {
    tick: 65,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating Initialize P&L Tracking to SpongeBob to free up capacity and ensure timely completion, as it's a high-pri",
    },
  },
  {
    tick: 65,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating Initialize P&L Tracking to Sandy to free up capacity and ensure timely completion, as it's a high-priorit",
    },
  },
  {
    tick: 65,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity, ensuring delivery plan is progressed",
    },
  },
  {
    tick: 68,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: Assigning critical delivery task to Squidward to ensure timely communication and efficient delivery process.",
    },
  },
  {
    tick: 68,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity for other tasks.",
    },
  },
  {
    tick: 68,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on estimating our delivery capacity. It's critical we understand how many orders we can fulfi",
    },
  },
  {
    tick: 70,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: Squidward, I need you to brief yourself on the delivery requirements ASAP. This task is critical and needs your immediat",
    },
  },
  {
    tick: 70,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating Initialize P&L Tracking to Sandy to free up capacity and ensure timely completion, as it's a high-priorit",
    },
  },
  {
    tick: 70,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating high-priority task to free up capacity for critical tasks.",
    },
  },
  {
    tick: 72,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 12,
        queueSize: 83,
        deliveryRate: 7,
        revenue: 30000,
        margin: 3.8,
        budgetUsed: 57,
        pattiesProduced: 114,
        pattiesDelivered: 31,
      },
    },
  },
  {
    tick: 73,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to free up capacity for other critical tasks and ensure timely compl",
    },
  },
  {
    tick: 73,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this high-priority task to Sandy to free up capacity for other critical tasks and ensure timely completio",
    },
  },
  {
    tick: 73,
    type: "delegation",
    data: {
      from: "squilliam-fancyson",
      to: "plankton",
      text: "📋 Squilliam Fancyson → Plankton: Assigning high-priority task to free up backlog and focus on financial strategy.",
    },
  },
  {
    tick: 75,
    type: "act_change",
    data: {
      act: 3,
    },
  },
  {
    tick: 75,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating Initialize P&L Tracking to SpongeBob to free up capacity, as it's a high-priority task and he has shown r",
    },
  },
  {
    tick: 75,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating Initialize P&L Tracking to Sandy to free up capacity for other critical tasks and ensure timely completio",
    },
  },
  {
    tick: 75,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity",
    },
  },
  {
    tick: 78,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating the task of initializing P&L tracking to SpongeBob SquarePants to ensure efficient financial management a",
    },
  },
  {
    tick: 78,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating Initialize P&L Tracking to Sandy to free up capacity and ensure efficient financial management, as it's a",
    },
  },
  {
    tick: 78,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on estimating our delivery capacity. It's critical for managing our workload and ensuring tim",
    },
  },
  {
    tick: 80,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating the task of initializing P&L tracking to SpongeBob SquarePants to ensure efficient financial management a",
    },
  },
  {
    tick: 80,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating the task of initializing P&L tracking to Sandy Cheeks to ensure efficient financial management and tracki",
    },
  },
  {
    tick: 80,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on estimating our delivery capacity. It's critical for managing our workload and ensuring tim",
    },
  },
  {
    tick: 80,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 13,
        queueSize: 92,
        deliveryRate: 8,
        revenue: 33333,
        margin: 3.8,
        budgetUsed: 63,
        pattiesProduced: 127,
        pattiesDelivered: 35,
      },
    },
  },
  {
    tick: 83,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: I'm assigning this critical task to Squidward to ensure timely delivery planning, as he's currently idle and needs to ta",
    },
  },
  {
    tick: 83,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on estimating our delivery capacity. It's critical for planning and ensuring we can meet dema",
    },
  },
  {
    tick: 83,
    type: "delegation",
    data: {
      from: "squilliam-fancyson",
      to: "plankton",
      text: "📋 Squilliam Fancyson → Plankton: Assigning critical task to free up bandwidth for high-priority tasks",
    },
  },
  {
    tick: 85,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to ensure efficient financial management and cost tracking.",
    },
  },
  {
    tick: 85,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this high-priority task to Sandy to ensure efficient financial management and cost tracking, and to free ",
    },
  },
  {
    tick: 85,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up resources for other tasks.",
    },
  },
  {
    tick: 88,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: I'm delegating this critical task to Squidward to ensure timely delivery planning, as his expertise in floor management ",
    },
  },
  {
    tick: 88,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, can you help with setting up labor cost tracking? This will help us optimize our kitchen operations and ensure ac",
    },
  },
  {
    tick: 88,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity for other tasks.",
    },
  },
  {
    tick: 88,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 14,
        queueSize: 102,
        deliveryRate: 8,
        revenue: 36666,
        margin: 3.9,
        budgetUsed: 69,
        pattiesProduced: 140,
        pattiesDelivered: 38,
      },
    },
  },
  {
    tick: 90,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: I'm delegating this critical task to Squidward Tentacles to ensure timely communication of delivery requirements, allowi",
    },
  },
  {
    tick: 90,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating TASK-1015 to Sandy to set up labor cost tracking, which will help us optimize our kitchen operations and ",
    },
  },
  {
    tick: 90,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Assigning critical task to Mermaid Man to free up capacity",
    },
  },
  {
    tick: 93,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to ensure efficient financial management and cost tracking, as he's ",
    },
  },
  {
    tick: 93,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this high-priority task to Sandy to ensure efficient financial management and cost tracking, as she's mak",
    },
  },
  {
    tick: 93,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to Mermaid Man to free up capacity",
    },
  },
  {
    tick: 95,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: I'm delegating this critical task to Squidward to ensure timely communication of delivery requirements, allowing him to ",
    },
  },
  {
    tick: 95,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating TASK-1015 to Sandy to set up labor cost tracking, which will help us efficiently manage our kitchen's fin",
    },
  },
  {
    tick: 95,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating high-priority task to free up capacity for critical tasks.",
    },
  },
  {
    tick: 96,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 16,
        queueSize: 110,
        deliveryRate: 9,
        revenue: 40000,
        margin: 3.9,
        budgetUsed: 76,
        pattiesProduced: 152,
        pattiesDelivered: 42,
      },
    },
  },
  {
    tick: 98,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: Assigning critical delivery task to Squidward to optimize floor operations and ensure timely execution.",
    },
  },
  {
    tick: 98,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this high-priority task to Sandy to ensure efficient financial management and cost tracking, as she's sho",
    },
  },
  {
    tick: 98,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Assigning critical task to Mermaid Man to free up capacity.",
    },
  },
  {
    tick: 100,
    type: "act_change",
    data: {
      act: 4,
    },
  },
  {
    tick: 100,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to free up my time for more critical decisions. I expect him to trac",
    },
  },
  {
    tick: 100,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating this high-priority task to Sandy to optimize our kitchen operations and ensure accurate financial trackin",
    },
  },
  {
    tick: 100,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity",
    },
  },
  {
    tick: 103,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: Assigning critical delivery task to Squidward to optimize floor operations and meet demand.",
    },
  },
  {
    tick: 103,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: I'm delegating TASK-1015 to Sandy to set up labor cost tracking, which will help us efficiently manage our kitchen's fin",
    },
  },
  {
    tick: 103,
    type: "delegation",
    data: {
      from: "karen",
      to: "mermaid-man",
      text: "📋 Karen → Mermaid Man: Delegating critical task to free up capacity for other tasks.",
    },
  },
  {
    tick: 104,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 17,
        queueSize: 120,
        deliveryRate: 10,
        revenue: 43333,
        margin: 3.9,
        budgetUsed: 82,
        pattiesProduced: 165,
        pattiesDelivered: 45,
      },
    },
  },
  {
    tick: 105,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: SpongeBob, I need you to set up the P&L tracking for the current batch of orders. This will help us keep an eye on our c",
    },
  },
  {
    tick: 105,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, can you help set up labor cost tracking? This will help us optimize our kitchen's financials and ensure accurate ",
    },
  },
  {
    tick: 105,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: I've assigned you another estimation task for delivery capacity. Please review and provide your assessment.",
    },
  },
  {
    tick: 108,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: SpongeBob, I need you to set up the P&L tracking for the current order. This is a high-priority task to ensure we can mo",
    },
  },
  {
    tick: 108,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → Sandy Cheeks: I'm delegating TASK-1015 to Sandy to set up labor cost tracking, which is a high-priority task that will help us monitor",
    },
  },
  {
    tick: 108,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on estimating our delivery capacity. We have a lot of orders coming in and I need to know how",
    },
  },
  {
    tick: 110,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: SpongeBob, I need you to set up the P&L tracking for the current batch of orders. This is a high-priority task to ensure",
    },
  },
  {
    tick: 110,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, can you help set up labor cost tracking? This will help us monitor our kitchen's expenses and optimize our workfl",
    },
  },
  {
    tick: 110,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "patrick-star",
      text: "📋 Sandy Cheeks → Patrick Star: Patrick, I need you to estimate our delivery capacity, which is currently at 8/tick. This will help us plan and optimize",
    },
  },
  {
    tick: 112,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 18,
        queueSize: 129,
        deliveryRate: 11,
        revenue: 46666,
        margin: 4,
        budgetUsed: 88,
        pattiesProduced: 178,
        pattiesDelivered: 49,
      },
    },
  },
  {
    tick: 113,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: SpongeBob, I need you to take the lead on initializing our P&L tracking. This is a high-priority task to ensure we can m",
    },
  },
  {
    tick: 113,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "karen",
      text: "📋 SpongeBob SquarePants → Karen: I'm delegating the task of initializing P&L tracking to Karen, as it's a high-priority task and she has the capacity to ",
    },
  },
  {
    tick: 113,
    type: "delegation",
    data: {
      from: "sandy-cheeks",
      to: "patrick-star",
      text: "📋 Sandy Cheeks → Patrick Star: Patrick, I need you to estimate our delivery capacity, which is currently set at 8/tick. Please review our current opera",
    },
  },
  {
    tick: 115,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "spongebob-squarepants",
      text: "📋 Mr. Krabs → SpongeBob SquarePants: I'm delegating this high-priority task to SpongeBob to free up my time for more critical decisions.",
    },
  },
  {
    tick: 115,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: Pearl, I need you to focus on estimating our delivery capacity. It's critical for managing our workload and ensuring tim",
    },
  },
  {
    tick: 115,
    type: "delegation",
    data: {
      from: "squilliam-fancyson",
      to: "plankton",
      text: "📋 Squilliam Fancyson → Plankton: Assigning TASK-1013 to Plankton for review and completion, as it is ready for review according to Plankton's progress up",
    },
  },
  {
    tick: 118,
    type: "delegation",
    data: {
      from: "mr-krabs",
      to: "squidward-tentacles",
      text: "📋 Mr. Krabs → Squidward Tentacles: I'm assigning this critical task to you, Squidward, as it's essential for our delivery operations. Please review the req",
    },
  },
  {
    tick: 118,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, I need you to estimate our delivery capacity, about 8 tasks per tick. This will help us plan and optimize our wor",
    },
  },
  {
    tick: 118,
    type: "delegation",
    data: {
      from: "squidward-tentacles",
      to: "pearl-krabs",
      text: "📋 Squidward Tentacles → Pearl Krabs: I've assigned this critical task to you, Pearl, to help with our delivery operations. Please provide an accurate estimat",
    },
  },
  {
    tick: 118,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 0,
        deliveryRate: 0,
        queueSize: 0,
        pattiesProduced: 191,
        pattiesDelivered: 53,
        revenue: 50000,
        margin: 3.8,
        budgetUsed: 96,
      },
    },
  },
  {
    tick: 119,
    type: "completion",
    data: {
      from: "mr-krabs",
      text: "🎉 LLM Simulation complete! 53/191 tasks. 387 decisions by meta-llama/llama-4-scout-17b-16e-instruct.",
    },
  },
  {
    tick: 120,
    type: "delegation",
    data: {
      from: "spongebob-squarepants",
      to: "sandy-cheeks",
      text: "📋 SpongeBob SquarePants → sandy-cheeks: Sandy, I need you to estimate our delivery capacity, assuming 8 tasks per tick. This will help us plan and optimize our ",
    },
  },
  {
    tick: 120,
    type: "node_status",
    data: {
      agent: "mr-krabs",
      status: "idle",
    },
  },
  {
    tick: 120,
    type: "node_status",
    data: {
      agent: "sandy-cheeks",
      status: "idle",
    },
  },
  {
    tick: 120,
    type: "node_status",
    data: {
      agent: "karen",
      status: "idle",
    },
  },
  {
    tick: 120,
    type: "node_status",
    data: {
      agent: "barnacle-boy",
      status: "idle",
    },
  },
  {
    tick: 120,
    type: "node_status",
    data: {
      agent: "squidward-tentacles",
      status: "idle",
    },
  },
  {
    tick: 120,
    type: "node_status",
    data: {
      agent: "perch-perkins",
      status: "idle",
    },
  },
  {
    tick: 120,
    type: "node_status",
    data: {
      agent: "pearl-krabs",
      status: "idle",
    },
  },
  {
    tick: 120,
    type: "node_status",
    data: {
      agent: "squilliam-fancyson",
      status: "idle",
    },
  },
  {
    tick: 120,
    type: "node_status",
    data: {
      agent: "spongebob-squarepants",
      status: "idle",
    },
  },
  {
    tick: 120,
    type: "stat_update",
    data: {
      stats: {
        kitchenRate: 20,
        queueSize: 138,
        deliveryRate: 12,
        revenue: 50000,
        margin: 4,
        budgetUsed: 95,
        pattiesProduced: 191,
        pattiesDelivered: 53,
      },
    },
  },
];
