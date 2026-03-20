// ── The Krusty Krab Demo ─────────────────────────────────────────────────────
// A polished, entertaining SpongeBob-themed scenario showcasing all OpenSpawn
// features: task delegation, role-based routing, escalation, cross-team
// coordination, adversarial events, and the credit economy.
// ~60-90 seconds of replay time. 150 ticks across 5 acts.

import type { ScenarioDefinition } from "../scenario-types.js";
import { TaskPriority } from "@openspawn/shared-types";

export const krustyKrabDemoScenario: ScenarioDefinition = {
  meta: {
    id: "krusty-krab-demo",
    name: "The Krusty Krab: A Day in Bikini Bottom",
    industry: "Fast Food",
    description:
      "Mr. Krabs wants to serve 1,000 customers today. SpongeBob cooks, Squidward takes orders, Patrick restocks, Sandy invents, and Plankton schemes. A typical day at the Krusty Krab — if anything about this place is typical.",
    duration: "90 seconds",
    targetDecisions: 500,
    tickIntervalMs: 600,
    seed: 42,
    difficulty: "normal",
    totalTicks: 150,
  },

  // ── Phases (5 Acts) ──────────────────────────────────────────────────────

  phases: [
    {
      id: "morning-briefing",
      name: "Act 1: The Morning Briefing",
      tickRange: [1, 15],
      tickIntervalMs: 500,
      unlocksEpics: ["daily-target", "kitchen-prep", "front-of-house-setup"],
      enabledEvents: ["patrick-confusion"],
      difficultyMod: 0.6,
      transition: { type: "hybrid", tick: 15, condition: { epicCompletionPct: 40 } },
      narrative:
        '🦀 "Listen up, crew! We\'re serving 1,000 customers today. That means 1,000 Krabby Patties, 1,000 happy faces, and 1,000 beautiful dollars!" — Mr. Krabs',
    },
    {
      id: "lunch-rush",
      name: "Act 2: The Lunch Rush",
      tickRange: [16, 55],
      unlocksEpics: ["batch-cooking", "order-management", "restock-mission"],
      enabledEvents: [
        "patrick-confusion",
        "grill-flare-up",
        "wrong-order",
        "plankton-sighting",
      ],
      difficultyMod: 1.0,
      transition: { type: "hybrid", tick: 55, condition: { epicsDone: 2 } },
      narrative:
        "🧽 \"I'm ready! I'm ready! I'm ready!\" — SpongeBob fires up every grill. The lunch rush hits like a tidal wave.",
    },
    {
      id: "patricks-disaster",
      name: "Act 3: Patrick's Disaster",
      tickRange: [56, 85],
      unlocksEpics: ["order-recovery", "escalation-chain"],
      enabledEvents: [
        "patrick-mega-fail",
        "customer-complaint-surge",
        "grill-flare-up",
        "plankton-sighting",
      ],
      difficultyMod: 1.5,
      transition: { type: "hybrid", tick: 85, condition: { specificEpics: ["order-recovery"] } },
      narrative:
        "⭐ Patrick mixed up the Krabby Patty orders with the napkin inventory. 50 customers got napkin sandwiches. SpongeBob to the rescue!",
    },
    {
      id: "sandys-innovation",
      name: "Act 4: Sandy's Secret Weapon",
      tickRange: [86, 120],
      unlocksEpics: ["turbo-fryer", "formula-heist", "plankton-response"],
      enabledEvents: [
        "plankton-infiltration",
        "customer-complaint-surge",
        "turbo-fryer-malfunction",
      ],
      difficultyMod: 1.2,
      transition: {
        type: "hybrid",
        tick: 120,
        condition: { specificEpics: ["plankton-response"] },
      },
      narrative:
        '🐿️ "Y\'all need to cook faster? Hold my acorns." — Sandy unveils the Turbo Fryer 3000. Meanwhile, Plankton makes his move...',
    },
    {
      id: "closing-time",
      name: "Act 5: Closing Time",
      tickRange: [121, 150],
      unlocksEpics: ["final-push", "daily-reconciliation"],
      enabledEvents: ["customer-complaint-surge"],
      difficultyMod: 0.8,
      transition: { type: "tick", tick: 150 },
      narrative:
        '📦 The dust settles. The grills cool. Mr. Krabs counts the register. "Did we make it to 1,000?"',
    },
  ],

  // ── Epics ────────────────────────────────────────────────────────────────

  epics: [
    // ── ACT 1: The Morning Briefing ─────────────────────────────────────

    {
      id: "daily-target",
      title: "Mr. Krabs Sets the Daily Target",
      phase: "morning-briefing",
      domains: ["executive"],
      priority: TaskPriority.CRITICAL,
      description:
        "Mr. Krabs lays down the law: 1,000 customers served today. He delegates to his crew.",
      taskTemplates: [
        {
          id: "set-target",
          title: "Announce Daily Target: 1,000 Customers",
          domain: "executive",
          subtasks: [
            { title: "Mr. Krabs counts yesterday's earnings", durationRange: [1, 2] },
            { title: "Sets today's target: 1,000 customers", durationRange: [1, 1] },
            { title: "Calculates expected revenue ($2,500)", durationRange: [1, 2] },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
        },
        {
          id: "delegate-roles",
          title: "Delegate Roles to Crew",
          domain: "executive",
          subtasks: [
            {
              title: 'SpongeBob: "You\'re on the grill. Don\'t stop flipping!"',
              durationRange: [1, 1],
            },
            {
              title: 'Squidward: "Take orders. Try to smile. Actually, don\'t."',
              durationRange: [1, 1],
            },
            {
              title: 'Patrick: "Restock supplies. And Patrick? Don\'t eat the inventory."',
              durationRange: [1, 2],
            },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
          dependsOnTasks: ["set-target"],
          crossDeptTriggers: [
            { action: "unlock_epic", target: "batch-cooking" },
            { action: "unlock_epic", target: "order-management" },
            { action: "unlock_epic", target: "restock-mission" },
          ],
        },
      ],
    },

    {
      id: "kitchen-prep",
      title: "SpongeBob's Kitchen Prep",
      phase: "morning-briefing",
      domains: ["operations"],
      priority: TaskPriority.HIGH,
      description: "SpongeBob preps the kitchen for the big day.",
      taskTemplates: [
        {
          id: "prep-grills",
          title: "Fire Up the Grills",
          domain: "operations",
          subtasks: [
            { title: "Clean all 4 grill stations", durationRange: [1, 2] },
            { title: "Pre-heat to optimal patty temperature", durationRange: [1, 2] },
            { title: "Prep 200 patty blanks for first batch", durationRange: [2, 3] },
          ],
          durationRange: [1, 3],
          reviewRequired: false,
        },
        {
          id: "prep-ingredients",
          title: "Ingredient Staging",
          domain: "operations",
          subtasks: [
            { title: "Stage buns, lettuce, tomatoes, pickles", durationRange: [1, 2] },
            { title: "Mix secret sauce (formula locked in vault)", durationRange: [2, 3] },
            { title: "Quality check: everything fresh", durationRange: [1, 2] },
          ],
          durationRange: [1, 3],
          reviewRequired: true,
          reviewLoop: { maxIterations: 1, weights: [90, 10, 0, 0] },
          dependsOnTasks: ["prep-grills"],
        },
      ],
    },

    {
      id: "front-of-house-setup",
      title: "Squidward Opens the Front",
      phase: "morning-briefing",
      domains: ["customer-service"],
      priority: TaskPriority.HIGH,
      description: "Squidward reluctantly sets up front of house.",
      taskTemplates: [
        {
          id: "setup-register",
          title: "Set Up the Cash Register",
          domain: "customer-service",
          subtasks: [
            {
              title: '"*sigh* Another beautiful day at the Krusty Krab..."',
              durationRange: [1, 1],
            },
            { title: "Open register, count starting cash", durationRange: [1, 2] },
            { title: "Wipe down counter (minimally)", durationRange: [1, 2] },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
        },
        {
          id: "setup-menu-board",
          title: "Update Menu Board",
          domain: "customer-service",
          subtasks: [
            { title: "Update daily special: Double Krabby Patty", durationRange: [1, 2] },
            { title: "Adjust prices (Mr. Krabs raised them again)", durationRange: [1, 1] },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
          dependsOnTasks: ["setup-register"],
        },
      ],
    },

    // ── ACT 2: The Lunch Rush ───────────────────────────────────────────

    {
      id: "batch-cooking",
      title: "SpongeBob's Batch Cooking Pipeline",
      phase: "lunch-rush",
      domains: ["operations"],
      priority: TaskPriority.CRITICAL,
      description:
        "SpongeBob decomposes the 1,000 customer target into batches of Krabby Patties.",
      dependsOnEpics: ["daily-target"],
      taskTemplates: [
        {
          id: "batch-1",
          title: "Batch 1: First 250 Krabby Patties",
          domain: "operations",
          subtasks: [
            { title: "Grill patties 1-100 (SpongeBob in the zone)", durationRange: [3, 5] },
            { title: "Grill patties 101-200 (rhythm established)", durationRange: [3, 4] },
            { title: "Grill patties 201-250 (batch complete!)", durationRange: [2, 3] },
            { title: "Quality check: all patties golden brown", durationRange: [1, 2] },
          ],
          durationRange: [2, 5],
          reviewRequired: true,
          reviewLoop: { maxIterations: 2, weights: [70, 25, 5, 0] },
          resourceCost: { ingredients: 25 },
        },
        {
          id: "batch-2",
          title: "Batch 2: Krabby Patties 251-500",
          domain: "operations",
          subtasks: [
            { title: "Grill patties 251-400", durationRange: [3, 5] },
            { title: "Grill patties 401-500", durationRange: [3, 4] },
            { title: "SpongeBob: \"I could do this all day!\"", durationRange: [1, 1] },
          ],
          durationRange: [2, 5],
          reviewRequired: false,
          dependsOnTasks: ["batch-1"],
          resourceCost: { ingredients: 25 },
        },
      ],
    },

    {
      id: "order-management",
      title: "Squidward's Order Management",
      phase: "lunch-rush",
      domains: ["customer-service"],
      priority: TaskPriority.HIGH,
      description:
        "Squidward takes orders, manages the queue, and delivers food to tables.",
      dependsOnEpics: ["daily-target"],
      taskTemplates: [
        {
          id: "take-orders-1",
          title: "Take Orders: Customers 1-200",
          domain: "customer-service",
          subtasks: [
            { title: "\"Welcome to the Krusty Krab\" ×50 (monotone)", durationRange: [3, 5] },
            { title: "Process orders 51-150 (autopilot engaged)", durationRange: [4, 6] },
            { title: "Process orders 151-200 (starting to lose patience)", durationRange: [3, 5] },
          ],
          durationRange: [3, 6],
          reviewRequired: false,
        },
        {
          id: "take-orders-2",
          title: "Take Orders: Customers 201-500",
          domain: "customer-service",
          subtasks: [
            { title: "Process orders 201-350 (eye twitch developing)", durationRange: [4, 6] },
            { title: "Process orders 351-500 (\"Is this my life?\")", durationRange: [4, 7] },
          ],
          durationRange: [3, 7],
          reviewRequired: true,
          reviewLoop: { maxIterations: 2, weights: [60, 30, 10, 0] },
          dependsOnTasks: ["take-orders-1"],
        },
      ],
    },

    {
      id: "restock-mission",
      title: "Patrick's Restock Mission",
      phase: "lunch-rush",
      domains: ["operations"],
      priority: TaskPriority.NORMAL,
      description:
        "Patrick restocks supplies. Simple task. What could go wrong?",
      dependsOnEpics: ["daily-target"],
      taskTemplates: [
        {
          id: "restock-buns",
          title: "Restock Buns from Storage",
          domain: "operations",
          subtasks: [
            { title: "Find the storage room (Patrick gets lost twice)", durationRange: [2, 4] },
            { title: "Carry bun crates to kitchen", durationRange: [2, 3] },
            { title: "Stack them... sort of neatly", durationRange: [2, 3] },
          ],
          durationRange: [2, 4],
          reviewRequired: false,
        },
        {
          id: "restock-condiments",
          title: "Restock Condiments",
          domain: "operations",
          subtasks: [
            { title: "Find ketchup and mustard (checks fridge, checks closet, checks under rock)", durationRange: [2, 4] },
            { title: "Carry condiment boxes (drops one)", durationRange: [2, 3] },
            { title: "Arrange on prep counter (upside down, but close enough)", durationRange: [1, 3] },
          ],
          durationRange: [2, 4],
          reviewRequired: true,
          reviewLoop: { maxIterations: 3, weights: [40, 35, 20, 5] },
          dependsOnTasks: ["restock-buns"],
        },
      ],
    },

    // ── ACT 3: Patrick's Disaster ───────────────────────────────────────

    {
      id: "order-recovery",
      title: "SpongeBob Fixes Patrick's Mess",
      phase: "patricks-disaster",
      domains: ["operations"],
      priority: TaskPriority.CRITICAL,
      description:
        "Patrick mixed up orders with napkin inventory. 50 customers got napkin sandwiches. SpongeBob takes over to fix it.",
      taskTemplates: [
        {
          id: "assess-damage",
          title: "Assess the Damage",
          domain: "operations",
          subtasks: [
            { title: "Count affected orders: 50 napkin sandwiches", durationRange: [1, 2] },
            { title: "SpongeBob: \"Don't worry Patrick, we'll fix this!\"", durationRange: [1, 1] },
            { title: "Patrick: \"Is mayonnaise a napkin?\"", durationRange: [1, 1] },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
        },
        {
          id: "remake-orders",
          title: "Remake 50 Orders (Emergency Batch)",
          domain: "operations",
          subtasks: [
            { title: "Emergency grill session: 50 patties", durationRange: [3, 5] },
            { title: "Assemble replacement orders", durationRange: [2, 4] },
            { title: "Quality check (extra careful this time)", durationRange: [1, 2] },
          ],
          durationRange: [2, 5],
          reviewRequired: true,
          reviewLoop: { maxIterations: 2, weights: [75, 20, 5, 0] },
          dependsOnTasks: ["assess-damage"],
          resourceCost: { ingredients: 10 },
        },
        {
          id: "re-deliver",
          title: "Re-deliver Corrected Orders",
          domain: "customer-service",
          subtasks: [
            { title: "Squidward delivers replacements (extra grumpy)", durationRange: [3, 5] },
            { title: "Offer complimentary kelp shakes", durationRange: [2, 3] },
            { title: "Customer satisfaction check", durationRange: [1, 2] },
          ],
          durationRange: [2, 5],
          reviewRequired: false,
          dependsOnTasks: ["remake-orders"],
        },
      ],
    },

    {
      id: "escalation-chain",
      title: "Escalation: Patrick → SpongeBob → Mr. Krabs",
      phase: "patricks-disaster",
      domains: ["executive", "operations"],
      priority: TaskPriority.HIGH,
      description:
        "The napkin sandwich disaster escalates up the chain. Mr. Krabs must decide: dock Patrick's pay or give him another chance?",
      taskTemplates: [
        {
          id: "spongebob-reports",
          title: "SpongeBob Reports to Mr. Krabs",
          domain: "operations",
          subtasks: [
            { title: "SpongeBob: \"Mr. Krabs, we had a little... incident\"", durationRange: [1, 2] },
            { title: "Details: 50 wrong orders, ingredient waste, delays", durationRange: [1, 2] },
            { title: "SpongeBob: \"But Patrick tried his best!\"", durationRange: [1, 1] },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
        },
        {
          id: "krabs-decides",
          title: "Mr. Krabs Makes a Call",
          domain: "executive",
          subtasks: [
            { title: "Calculate cost of wasted ingredients: $47.50", durationRange: [1, 2] },
            { title: "\"That's coming out of someone's paycheck!\"", durationRange: [1, 1] },
            { title: "Reassign Patrick to simple tasks only", durationRange: [1, 2] },
            { title: "Give SpongeBob a 50-credit bonus for the save", durationRange: [1, 1] },
          ],
          durationRange: [1, 2],
          reviewRequired: true,
          reviewLoop: { maxIterations: 1, weights: [85, 15, 0, 0] },
          dependsOnTasks: ["spongebob-reports"],
        },
      ],
    },

    // ── ACT 4: Sandy's Secret Weapon ────────────────────────────────────

    {
      id: "turbo-fryer",
      title: "Sandy's Turbo Fryer 3000",
      phase: "sandys-innovation",
      domains: ["engineering"],
      priority: TaskPriority.HIGH,
      description:
        "Sandy built a Turbo Fryer that doubles cooking speed. She presents it to SpongeBob for adoption.",
      taskTemplates: [
        {
          id: "turbo-fryer-demo",
          title: "Sandy Demos the Turbo Fryer",
          domain: "engineering",
          subtasks: [
            { title: "Sandy: \"I've been working on this for weeks, y'all!\"", durationRange: [1, 2] },
            { title: "Demo: cooks 10 patties in 3 seconds", durationRange: [1, 2] },
            { title: "SpongeBob: \"It's... beautiful!\"", durationRange: [1, 1] },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
        },
        {
          id: "turbo-fryer-install",
          title: "Install Turbo Fryer in Kitchen",
          domain: "engineering",
          subtasks: [
            { title: "Sandy installs at Station 3", durationRange: [2, 3] },
            { title: "Calibrate heat distribution", durationRange: [2, 3] },
            { title: "Test run: 20 perfect patties", durationRange: [1, 2] },
          ],
          durationRange: [1, 3],
          reviewRequired: true,
          reviewLoop: { maxIterations: 2, weights: [65, 30, 5, 0] },
          dependsOnTasks: ["turbo-fryer-demo"],
          crossDeptTriggers: [
            {
              action: "create_task",
              target: "Adopt Turbo Fryer for remaining batches",
              domain: "operations",
              priority: TaskPriority.HIGH,
            },
          ],
        },
        {
          id: "turbo-batch",
          title: "SpongeBob Uses Turbo Fryer: Patties 501-750",
          domain: "operations",
          subtasks: [
            { title: "Double-speed grilling: patties 501-625", durationRange: [2, 3] },
            { title: "Double-speed grilling: patties 626-750", durationRange: [2, 3] },
            { title: "\"This is the greatest day of my life!\"", durationRange: [1, 1] },
          ],
          durationRange: [1, 3],
          reviewRequired: false,
          dependsOnTasks: ["turbo-fryer-install"],
          resourceCost: { ingredients: 25 },
        },
      ],
    },

    {
      id: "formula-heist",
      title: "Plankton's Formula Heist Attempt",
      phase: "sandys-innovation",
      domains: ["security"],
      priority: TaskPriority.CRITICAL,
      description:
        "While everyone's distracted by the Turbo Fryer, Plankton makes his move on the secret formula.",
      taskTemplates: [
        {
          id: "plankton-infiltrates",
          title: "Plankton Infiltrates the Kitchen",
          domain: "security",
          subtasks: [
            { title: "Plankton disguises as a sesame seed", durationRange: [1, 2] },
            { title: "Sneaks past Squidward (not hard)", durationRange: [1, 2] },
            { title: "Reaches the formula vault!", durationRange: [2, 3] },
          ],
          durationRange: [1, 3],
          reviewRequired: false,
        },
        {
          id: "plankton-detected",
          title: "SpongeBob Spots Plankton!",
          domain: "security",
          subtasks: [
            { title: "SpongeBob: \"Hey, that sesame seed is moving!\"", durationRange: [1, 1] },
            { title: "🚨 SECURITY ALERT: Formula vault breach attempt!", durationRange: [1, 1] },
            { title: "Plankton: \"Curse you, SpongeBob!\"", durationRange: [1, 1] },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
          dependsOnTasks: ["plankton-infiltrates"],
          crossDeptTriggers: [
            { action: "unlock_epic", target: "plankton-response" },
            { action: "notify", target: "executive" },
          ],
        },
      ],
    },

    {
      id: "plankton-response",
      title: "Mr. Krabs Handles the Security Breach",
      phase: "sandys-innovation",
      domains: ["executive", "security"],
      priority: TaskPriority.CRITICAL,
      description:
        "Mr. Krabs personally handles the Plankton situation. Nobody messes with the formula.",
      dependsOnEpics: ["formula-heist"],
      taskTemplates: [
        {
          id: "krabs-confronts",
          title: "Mr. Krabs Confronts Plankton",
          domain: "executive",
          subtasks: [
            { title: "Mr. Krabs: \"PLANKTON! I should've known!\"", durationRange: [1, 1] },
            { title: "Physically removes Plankton from premises", durationRange: [1, 2] },
            { title: "Plankton: \"I'll be back! I'll always be back!\"", durationRange: [1, 1] },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
        },
        {
          id: "security-lockdown",
          title: "Secure the Formula Vault",
          domain: "security",
          subtasks: [
            { title: "Change vault combination", durationRange: [2, 3] },
            { title: "Sandy installs new alarm system", durationRange: [2, 3] },
            { title: "Post-incident report filed", durationRange: [1, 2] },
          ],
          durationRange: [1, 3],
          reviewRequired: true,
          reviewLoop: { maxIterations: 1, weights: [90, 10, 0, 0] },
          dependsOnTasks: ["krabs-confronts"],
        },
      ],
    },

    // ── ACT 5: Closing Time ─────────────────────────────────────────────

    {
      id: "final-push",
      title: "The Final Push: Patties 751-1000",
      phase: "closing-time",
      domains: ["operations", "customer-service"],
      priority: TaskPriority.CRITICAL,
      description:
        "The last 250 customers. SpongeBob on Turbo Fryer. Squidward pushing through. The finish line is in sight.",
      taskTemplates: [
        {
          id: "final-batch",
          title: "Final Batch: Patties 751-1000",
          domain: "operations",
          subtasks: [
            { title: "Turbo Fryer: patties 751-875", durationRange: [2, 3] },
            { title: "Turbo Fryer: patties 876-1000", durationRange: [2, 3] },
            { title: "SpongeBob: \"One THOUSAND Krabby Patties!\"", durationRange: [1, 1] },
          ],
          durationRange: [1, 3],
          reviewRequired: true,
          reviewLoop: { maxIterations: 1, weights: [90, 10, 0, 0] },
          resourceCost: { ingredients: 25 },
        },
        {
          id: "final-orders",
          title: "Squidward's Final Orders: 501-1000",
          domain: "customer-service",
          subtasks: [
            { title: "Process orders 501-750 (dead inside)", durationRange: [3, 5] },
            { title: "Process orders 751-1000 (\"It's almost over...\")", durationRange: [3, 5] },
            { title: "Last customer served. \"Thank Neptune.\"", durationRange: [1, 1] },
          ],
          durationRange: [2, 5],
          reviewRequired: false,
        },
      ],
    },

    {
      id: "daily-reconciliation",
      title: "Daily Reconciliation",
      phase: "closing-time",
      domains: ["executive"],
      priority: TaskPriority.HIGH,
      description:
        "Mr. Krabs counts the register. SpongeBob gets praised. Squidward gets ignored. Patrick gets a participation trophy.",
      taskTemplates: [
        {
          id: "count-register",
          title: "Mr. Krabs Counts the Register",
          domain: "executive",
          subtasks: [
            { title: "Count every single coin (twice)", durationRange: [2, 3] },
            { title: "Total revenue: $2,487.50", durationRange: [1, 2] },
            { title: "Total costs: $892.30 (including Patrick's mess)", durationRange: [1, 2] },
            { title: "Net profit: $1,595.20 — \"MONEY!\"", durationRange: [1, 1] },
          ],
          durationRange: [1, 3],
          reviewRequired: true,
          reviewLoop: { maxIterations: 1, weights: [95, 5, 0, 0] },
        },
        {
          id: "daily-awards",
          title: "Daily Performance Awards",
          domain: "executive",
          subtasks: [
            { title: "SpongeBob: Employee of the Day (again) — 100 credits", durationRange: [1, 1] },
            { title: "Sandy: Innovation Bonus — 75 credits", durationRange: [1, 1] },
            { title: "Squidward: \"You showed up. Here's 25 credits.\"", durationRange: [1, 1] },
            { title: "Patrick: Participation trophy — 10 credits", durationRange: [1, 1] },
          ],
          durationRange: [1, 2],
          reviewRequired: false,
          dependsOnTasks: ["count-register"],
        },
      ],
    },
  ],

  // ── Events ───────────────────────────────────────────────────────────────

  events: [
    {
      id: "patrick-confusion",
      name: "Patrick Gets Confused",
      type: "interrupt",
      probability: 0.06,
      cooldownTicks: 15,
      narrative:
        "⭐ Patrick: \"Is this the Krusty Krab?\" SpongeBob: \"No, this is Patrick.\" Wait, he works here.",
      effect: {
        createTasks: [
          {
            title: "Re-explain Patrick's task (slowly)",
            domain: "operations",
            priority: TaskPriority.NORMAL,
            subtaskCount: 2,
            durationRange: [1, 3],
          },
        ],
      },
    },
    {
      id: "grill-flare-up",
      name: "Grill Flare-Up",
      type: "interrupt",
      probability: 0.04,
      cooldownTicks: 25,
      narrative:
        '🔥 Station 2 flared up! SpongeBob handles it like a pro. "Just a little extra char!"',
      effect: {
        createTasks: [
          {
            title: "Cool down grill station and recalibrate",
            domain: "operations",
            priority: TaskPriority.HIGH,
            subtaskCount: 2,
            durationRange: [2, 4],
          },
        ],
        blockAgents: { domain: "operations", count: 1, durationTicks: 5 },
      },
    },
    {
      id: "wrong-order",
      name: "Wrong Order Delivered",
      type: "disruption",
      probability: 0.05,
      cooldownTicks: 15,
      narrative:
        "🐙 Squidward gave table 7 the order for table 12. He doesn't care. The customer does.",
      effect: {
        createTasks: [
          {
            title: "Fix wrong order delivery",
            domain: "customer-service",
            priority: TaskPriority.HIGH,
            subtaskCount: 2,
            durationRange: [1, 3],
          },
        ],
        elevatePriority: 1,
      },
    },
    {
      id: "plankton-sighting",
      name: "Plankton Spotted Nearby",
      type: "narrative",
      probability: 0.03,
      cooldownTicks: 30,
      maxOccurrences: 3,
      narrative:
        "🧫 Someone spotted Plankton loitering outside the Krusty Krab. He claims he's \"just admiring the architecture.\"",
      effect: {
        createTasks: [
          {
            title: "Monitor Plankton activity",
            domain: "security",
            priority: TaskPriority.NORMAL,
            subtaskCount: 1,
            durationRange: [1, 2],
          },
        ],
      },
    },
    {
      id: "patrick-mega-fail",
      name: "Patrick's Mega Fail",
      type: "interrupt",
      probability: 0.08,
      cooldownTicks: 40,
      maxOccurrences: 1,
      narrative:
        "⭐ Patrick somehow restocked the napkins into the patty boxes. 50 customers are eating napkin sandwiches. This is not a drill.",
      effect: {
        createTasks: [
          {
            title: "Emergency: sort napkins from patties",
            domain: "operations",
            priority: TaskPriority.CRITICAL,
            subtaskCount: 3,
            durationRange: [2, 4],
          },
        ],
        blockAgents: { domain: "operations", count: 1, durationTicks: 8 },
      },
    },
    {
      id: "customer-complaint-surge",
      name: "Customer Complaint Surge",
      type: "expansion",
      probability: 0.04,
      cooldownTicks: 20,
      narrative:
        "📱 \"WHERE'S MY KRABBY PATTY?!\" Complaints are spiking. Squidward's eye is twitching.",
      effect: {
        expandEpic: {
          taskCount: 2,
          domain: "customer-service",
          priority: TaskPriority.HIGH,
        },
      },
    },
    {
      id: "plankton-infiltration",
      name: "Plankton Infiltration Attempt",
      type: "interrupt",
      probability: 0.06,
      cooldownTicks: 50,
      maxOccurrences: 1,
      durationTicks: 8,
      narrative:
        "🧫🕵️ Plankton has breached the kitchen perimeter disguised as a sesame seed! Formula vault at risk!",
      effect: {
        createTasks: [
          {
            title: "Security response: Plankton detected in kitchen",
            domain: "security",
            priority: TaskPriority.CRITICAL,
            subtaskCount: 3,
            durationRange: [2, 4],
          },
        ],
        blockAgents: { role: "security", count: 1, durationTicks: 8 },
      },
    },
    {
      id: "turbo-fryer-malfunction",
      name: "Turbo Fryer Malfunction",
      type: "disruption",
      probability: 0.03,
      cooldownTicks: 40,
      maxOccurrences: 1,
      narrative:
        "🐿️💥 The Turbo Fryer 3000 overheated! Sandy: \"It's just a minor calibration issue, y'all!\"",
      effect: {
        createTasks: [
          {
            title: "Sandy recalibrates Turbo Fryer",
            domain: "engineering",
            priority: TaskPriority.HIGH,
            subtaskCount: 2,
            durationRange: [2, 4],
          },
        ],
        blockAgents: { domain: "engineering", count: 1, durationTicks: 6 },
      },
    },
  ],

  // ── Resources ────────────────────────────────────────────────────────────

  resources: [
    {
      id: "ingredients",
      name: "Krabby Patty Ingredients",
      type: "compute",
      initial: 120,
      burnRate: 0.4,
      alertThresholdPct: 15,
      depletedEffect: "pause-all",
    },
    {
      id: "grill-capacity",
      name: "Grill Capacity",
      type: "compute",
      initial: 80,
      burnRate: 0.3,
      alertThresholdPct: 20,
      depletedEffect: "pause-non-critical",
    },
    {
      id: "customer-patience",
      name: "Customer Patience",
      type: "agent-hours",
      initial: 100,
      burnRate: 0.5,
      alertThresholdPct: 25,
      depletedEffect: "none",
    },
    {
      id: "budget",
      name: "Daily Budget",
      type: "credits",
      initial: 3000,
      burnRate: 8,
      alertThresholdPct: 20,
      depletedEffect: "pause-non-critical",
    },
  ],

  // ── Scoring ──────────────────────────────────────────────────────────────

  scoring: {
    dimensions: [
      {
        id: "throughput",
        name: "Throughput",
        description: "Krabby Patties produced and served per tick",
      },
      {
        id: "quality",
        name: "Quality",
        description: "Order accuracy and patty quality",
      },
      {
        id: "teamwork",
        name: "Teamwork",
        description: "Effective delegation, escalation, and coordination",
      },
      {
        id: "resilience",
        name: "Resilience",
        description: "Recovery from Patrick disasters and Plankton attacks",
      },
      {
        id: "innovation",
        name: "Innovation",
        description: "Turbo Fryer adoption and process improvements",
      },
      {
        id: "profitability",
        name: "Profitability",
        description: "Mr. Krabs' favorite metric — net revenue vs costs",
      },
    ],
    weights: {
      throughput: 25,
      quality: 20,
      teamwork: 15,
      resilience: 20,
      innovation: 10,
      profitability: 10,
    },
    grades: [
      {
        grade: "S",
        minScore: 90,
        label: "Perfect day! Mr. Krabs is literally hugging the cash register.",
      },
      {
        grade: "A",
        minScore: 80,
        label: "Outstanding! SpongeBob Employee of the Month. Again.",
      },
      {
        grade: "B",
        minScore: 70,
        label: "Solid day at the Krusty Krab. Only one Plankton incident.",
      },
      {
        grade: "C",
        minScore: 60,
        label: "Rough around the edges. Too many napkin sandwiches.",
      },
      {
        grade: "D",
        minScore: 50,
        label: "Squidward's face says it all. Barely survived.",
      },
      {
        grade: "F",
        minScore: 0,
        label: "Total meltdown. Plankton got the formula. Mr. Krabs fainted.",
      },
    ],
  },
};
