// ── ORG.md Parser ────────────────────────────────────────────────────────────
// Parses an ORG.md file into a ParsedOrg structure for the sandbox
// Uses unified/remark to parse markdown into an AST, then walks the tree.

import { readFileSync } from "node:fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import type {
  Root,
  Heading,
  Content,
  List,
  ListItem,
  Paragraph,
  Text,
  Strong,
  PhrasingContent,
} from "mdast";
import type { SandboxAgent } from "./types.js";
import type { ACPMessage } from "./types.js";
import { ACPMessageType, AgentRole, AgentStatus, TriggerMode } from "@openspawn/shared-types";

// Map character names to avatar image files served at /avatars/ by the sandbox API
const AVATAR_FILES: Record<string, string> = {
  "mr. krabs": "/avatars/mr-krabs.png",
  "sandy cheeks": "/avatars/sandy.png",
  "spongebob squarepants": "/avatars/spongebob.png",
  spongebob: "/avatars/spongebob.png",
  "patrick star": "/avatars/patrick.png",
  patrick: "/avatars/patrick.png",
  "squidward tentacles": "/avatars/squidward.png",
  squidward: "/avatars/squidward.png",
  "pearl krabs": "/avatars/pearl.png",
  pearl: "/avatars/pearl.png",
  gary: "/avatars/gary.png",
  "plankton jr.": "/avatars/plankton.png",
  plankton: "/avatars/plankton.png",
  karen: "/avatars/karen.png",
  "mermaid man": "/avatars/mermaid-man.png",
  "barnacle boy": "/avatars/barnacle-boy.png",
  "larry the lobster": "/avatars/larry.png",
  larry: "/avatars/larry.png",
  "mrs. puff": "/avatars/mrs-puff.png",
  "squilliam fancyson": "/avatars/squilliam.png",
  squilliam: "/avatars/squilliam.png",
  "flying dutchman": "/avatars/flying-dutchman.png",
};

function nameToAvatarUrl(name: string): string | undefined {
  // Try exact match first, then first name
  const lower = name.toLowerCase();
  if (AVATAR_FILES[lower]) return AVATAR_FILES[lower];
  // Try matching on first part (e.g. "Sandy Cheeks — Engineering Lead" → "sandy cheeks")
  for (const [key, url] of Object.entries(AVATAR_FILES)) {
    if (lower.includes(key)) return url;
  }
  return undefined;
}

export type GuardrailAction = "block" | "escalate" | "require_approval" | "warn" | "log";

export interface Guardrail {
  name: string;
  trigger: string;
  condition?: string;
  match?: string;
  action: GuardrailAction;
  escalate_to?: string;
  message: string;
}

export interface ParsedOrg {
  name: string;
  agents: SandboxAgent[];
  culture: {
    preset?: string;
    escalationVelocity?: string;
    progressFrequency?: string;
    ackRequired?: boolean;
    maxEscalationDepth?: number;
    completenessPrinciple?: string;
    knowledgeLayers?: string[];
  };
  policies: {
    perAgentBudget?: number;
    alertThreshold?: number;
    departmentCaps?: Record<string, number>;
    completionStatus?: string;
  };
  guardrails?: Guardrail[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
}

/** Extract just the name from a heading like "Mr. Krabs — CEO" → "Mr. Krabs" */
function nameFromHeading(heading: string): string {
  const dashIdx = heading.indexOf(" — ");
  return dashIdx > 0 ? heading.slice(0, dashIdx).trim() : heading;
}

function inferLevelAndRole(name: string): { level: number; role: SandboxAgent["role"] } {
  const n = name.toLowerCase();
  if (/\b(coo|cto|ceo)\b/.test(n)) return { level: 10, role: AgentRole.COO };
  if (/\b(cfo|vp|director|talent)\b/.test(n)) return { level: 9, role: AgentRole.TALENT };
  if (/\b(lead|manager)\b/.test(n)) return { level: 7, role: AgentRole.LEAD };
  if (/\b(senior|principal)\b/.test(n)) return { level: 6, role: AgentRole.SENIOR };
  if (/\b(junior|intern|assistant)\b/.test(n)) return { level: 1, role: AgentRole.INTERN };
  return { level: 4, role: AgentRole.WORKER };
}

/** Extract text content from a phrasing node tree */
function phrasingToText(nodes: PhrasingContent[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return (n as Text).value;
      if ("children" in n) return phrasingToText((n as { children: PhrasingContent[] }).children);
      return "";
    })
    .join("");
}

/** Extract text from any mdast node */
function nodeToText(node: Content): string {
  if (node.type === "text") return (node as Text).value;
  if ("children" in node)
    return (node as { children: Content[] }).children.map((c: Content) => nodeToText(c)).join("");
  return "";
}

/** Extract bold-key: value pairs from a list in mdast */
function _extractMetaFromList(items: ListItem[]): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const item of items) {
    const text = item.children
      .map((c) => nodeToText(c))
      .join("")
      .trim();
    const m = text.match(/^(.+?):\s*(.+)$/);
    if (m) {
      const key = m[1].trim().toLowerCase().replace(/\s+/g, "_");
      meta[key] = m[2].trim();
    }
  }
  return meta;
}

/** Extract bold-key metadata from list items: **Key:** Value */
function extractMetaFromNodes(nodes: Content[]): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const node of nodes) {
    if (node.type === "list") {
      const list = node as List;
      for (const item of list.children) {
        // Get the paragraph inside the list item
        for (const child of item.children) {
          if (child.type === "paragraph") {
            const para = child as Paragraph;
            // Check if first child is Strong (bold)
            if (para.children.length >= 1 && para.children[0].type === "strong") {
              const strong = para.children[0] as Strong;
              const keyText = phrasingToText(strong.children);
              // Key ends with ':'
              const key = keyText
                .replace(/:$/, "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/-/g, "_");
              // Value is the rest of the paragraph text
              const restText = phrasingToText(para.children.slice(1)).trim().replace(/^\s*/, "");
              if (key && restText) {
                meta[key] = restText;
              }
            }
          }
        }
      }
    }
  }
  return meta;
}

/** Extract prose (non-meta text) from content nodes */
function extractProseFromNodes(nodes: Content[]): string {
  const parts: string[] = [];
  for (const node of nodes) {
    if (node.type === "paragraph") {
      parts.push(phrasingToText((node as Paragraph).children));
    }
  }
  return parts.join(" ").trim();
}

const wakeOnMap: Record<string, ACPMessage["type"]> = {
  escalations: ACPMessageType.ESCALATION,
  escalation: ACPMessageType.ESCALATION,
  completions: ACPMessageType.COMPLETION,
  completion: ACPMessageType.COMPLETION,
  delegations: ACPMessageType.DELEGATION,
  delegation: ACPMessageType.DELEGATION,
  orders: ACPMessageType.DELEGATION,
  progress: ACPMessageType.PROGRESS,
  ack: ACPMessageType.ACK,
  status: ACPMessageType.STATUS_REQUEST,
};

function parseTriggerMeta(meta: Record<string, string>): {
  trigger?: TriggerMode;
  triggerOn?: ACPMessage["type"][];
} {
  const result: { trigger?: TriggerMode; triggerOn?: ACPMessage["type"][] } = {};
  if (meta["trigger"]) {
    const t = meta["trigger"].toLowerCase().trim();
    if (t === "event-driven" || t === "event_driven") result.trigger = TriggerMode.EVENT_DRIVEN;
    else if (t === "polling") result.trigger = TriggerMode.POLLING;
  }
  if (meta["wake_on"]) {
    result.triggerOn = meta["wake_on"]
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .map((s) => wakeOnMap[s])
      .filter((s): s is ACPMessage["type"] => !!s);
  }
  return result;
}

function makeAgent(
  id: string,
  name: string,
  role: SandboxAgent["role"],
  level: number,
  domain: string,
  parentId: string | undefined,
  systemPrompt: string,
  triggerConfig?: { trigger?: TriggerMode; triggerOn?: ACPMessage["type"][] },
  avatar?: string,
  avatarColor?: string,
  avatarUrl?: string,
): SandboxAgent {
  const canSpawn = level >= 7;
  const roleInstruction =
    level >= 7
      ? "You DELEGATE tasks to your direct reports. Only SPAWN new agents if explicitly asked to hire."
      : level >= 5
        ? "You do complex work and can delegate to juniors."
        : "You do assigned tasks. Escalate if stuck.";

  const spawnAction = canSpawn
    ? `\n- {"action":"spawn_agent","name":"...","domain":"...","role":"...","reason":"..."}`
    : "";

  const fullPrompt = `You are "${name}", L${level} ${domain}. ${roleInstruction}
${systemPrompt}
IMPORTANT: Do NOT repeat yourself. If you already sent a message or delegated a task, use {"action":"idle"} and wait. Never ask for the same update twice.
Respond with JSON ONLY. Actions:
- {"action":"delegate","taskId":"ID","targetAgentId":"ID","reason":"..."}
- {"action":"work","taskId":"ID","result":"what you did"}
- {"action":"message","to":"agent_id","content":"..."}
- {"action":"escalate","taskId":"ID","reason":"BLOCKED","body":"why stuck"}
- {"action":"create_task","title":"...","description":"...","priority":"normal"}
- {"action":"review","taskId":"ID","verdict":"approve","feedback":"..."}${spawnAction}
- {"action":"idle"}`;

  const defaultTrigger: TriggerMode = level >= 7 ? TriggerMode.EVENT_DRIVEN : TriggerMode.POLLING;
  const defaultTriggerOn: ACPMessage["type"][] | undefined =
    level >= 7
      ? [
          ACPMessageType.ESCALATION,
          ACPMessageType.COMPLETION,
          ACPMessageType.DELEGATION,
          ACPMessageType.STATUS_REQUEST,
        ]
      : undefined;

  return {
    id,
    name,
    role,
    level,
    domain,
    avatar,
    avatarColor,
    avatarUrl: avatarUrl || nameToAvatarUrl(name),
    parentId,
    status: AgentStatus.ACTIVE,
    systemPrompt: fullPrompt,
    taskIds: [],
    recentMessages: [],
    trigger: triggerConfig?.trigger ?? defaultTrigger,
    triggerOn: triggerConfig?.triggerOn ?? defaultTriggerOn,
    inbox: [],
    stats: {
      tasksCompleted: 0,
      tasksFailed: 0,
      messagesSent: 0,
      creditsEarned: 0,
      creditsSpent: 0,
    },
  };
}

// ── AST Section Extraction ───────────────────────────────────────────────────

interface AstSection {
  heading: string;
  level: number;
  /** Content nodes between this heading and the next heading of same or higher level */
  content: Content[];
  children: AstSection[];
}

/** Walk the flat mdast children and build a nested section tree */
function buildSectionTree(nodes: Content[]): AstSection[] {
  const root: AstSection[] = [];
  const stack: AstSection[] = [];

  for (const node of nodes) {
    if (node.type === "heading") {
      const h = node as Heading;
      const heading = phrasingToText(h.children);
      const section: AstSection = { heading, level: h.depth, content: [], children: [] };

      // Pop stack until we find a parent with lower level
      while (stack.length > 0 && stack[stack.length - 1].level >= h.depth) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(section);
      } else {
        root.push(section);
      }
      stack.push(section);
    } else if (stack.length > 0) {
      stack[stack.length - 1].content.push(node);
    }
  }

  return root;
}

// ── Main parser ──────────────────────────────────────────────────────────────

export function parseOrgMd(filePath: string): ParsedOrg {
  const raw = readFileSync(filePath, "utf-8");
  return parseOrgMdContent(raw);
}

export function parseOrgMdContent(raw: string): ParsedOrg {
  const tree = unified().use(remarkParse).use(remarkFrontmatter, ["yaml"]).parse(raw) as Root;

  const sections = buildSectionTree(tree.children as Content[]);

  // Extract org name from first H1
  const h1 = sections.find((s) => s.level === 1);
  const orgName = h1?.heading ?? "Unnamed Org";

  // All H2 sections (either top-level or children of H1)
  const h2Sections = h1
    ? h1.children.filter((s) => s.level === 2)
    : sections.filter((s) => s.level === 2);

  const findSection = (name: string) =>
    h2Sections.find((s) => s.heading.toLowerCase().includes(name.toLowerCase()));

  // ── Identity ───────────────────────────────────────────────────────────
  const identitySection = findSection("Identity");
  const identityContext = identitySection ? extractProseFromNodes(identitySection.content) : "";

  // ── Culture ────────────────────────────────────────────────────────────
  const cultureSection = findSection("Culture");
  const cultureMeta = cultureSection ? extractMetaFromNodes(cultureSection.content) : {};
  // Also check for bare "preset: xxx" in paragraph text
  const cultureText = cultureSection
    ? cultureSection.content.map((n) => nodeToText(n)).join("\n")
    : "";
  const presetMatch = cultureText.match(/preset:\s*(\w+)/i);
  // Extract completeness_principle and knowledge_layers from culture text
  const completenessMatch = cultureText.match(/completeness_principle:\s*"([^"]+)"/i);
  const knowledgeLayerMatches = [...cultureText.matchAll(/^\s*-\s*"(Layer \d+:.+)"/gm)];
  const culture: ParsedOrg["culture"] = {
    preset: presetMatch?.[1] ?? cultureMeta["preset"],
    escalationVelocity: cultureMeta["escalation"],
    progressFrequency: cultureMeta["progress_updates"] ?? cultureMeta["progress"],
    ackRequired: cultureMeta["ack_required"]
      ? cultureMeta["ack_required"].toLowerCase() === "yes"
      : undefined,
    maxEscalationDepth: cultureMeta["hierarchy_depth"]
      ? parseInt(cultureMeta["hierarchy_depth"].replace(/\D/g, "")) || undefined
      : undefined,
    completenessPrinciple: completenessMatch?.[1],
    knowledgeLayers: knowledgeLayerMatches.length > 0
      ? knowledgeLayerMatches.map((m) => m[1])
      : undefined,
  };

  // ── Policies ───────────────────────────────────────────────────────────
  const policiesSection = findSection("Policies");
  const policies: ParsedOrg["policies"] = {};
  if (policiesSection) {
    // Policies has H3 subsections: Budget, Department Caps, Permissions
    const allPolicyContent = [
      ...policiesSection.content,
      ...policiesSection.children.flatMap((c) => c.content),
    ];
    const pMeta = extractMetaFromNodes(allPolicyContent);
    if (pMeta["per_agent_limit"]) {
      policies.perAgentBudget = parseInt(pMeta["per_agent_limit"].replace(/\D/g, "")) || undefined;
    }
    if (pMeta["alert_threshold"]) {
      policies.alertThreshold = parseInt(pMeta["alert_threshold"].replace(/\D/g, "")) || undefined;
    }
    // Parse department caps from list items like "Engineering: max 12 agents"
    const caps: Record<string, number> = {};
    for (const child of policiesSection.children) {
      if (child.heading.toLowerCase().includes("department cap")) {
        for (const node of child.content) {
          if (node.type === "list") {
            for (const item of (node as List).children) {
              const text = item.children
                .map((c) => nodeToText(c))
                .join("")
                .trim();
              const capMatch = text.match(/^(\w[\w\s]*?):\s*max\s+(\d+)/i);
              if (capMatch) {
                caps[capMatch[1].trim().toLowerCase()] = parseInt(capMatch[2]);
              }
            }
          }
        }
      }
    }
    if (Object.keys(caps).length > 0) policies.departmentCaps = caps;

    // Extract completion_status policy
    const policyText = allPolicyContent.map((n) => nodeToText(n)).join("\n");
    const completionMatch = policyText.match(/completion_status:\s*"([^"]+)"/i);
    if (completionMatch) {
      policies.completionStatus = completionMatch[1];
    }
  }

  // ── Structure ──────────────────────────────────────────────────────────
  const structureSection = findSection("Structure");
  const agents: SandboxAgent[] = [];

  if (structureSection) {
    let cooId: string | undefined;

    for (const dept of structureSection.children) {
      if (dept.level !== 3) continue;

      const deptMeta = extractMetaFromNodes(dept.content);
      const deptProse = extractProseFromNodes(dept.content);
      const inferred = inferLevelAndRole(dept.heading);
      const deptLevel = deptMeta["level"]
        ? parseInt(deptMeta["level"]) || inferred.level
        : inferred.level;
      const deptRole = inferred.role;

      const isCLevel = deptLevel >= 10;

      if (isCLevel || dept.children.length === 0) {
        // Direct agent at ### level (C-level or solo)
        const id = makeId(deptMeta["id"] ?? nameFromHeading(dept.heading));
        const domain = deptMeta["domain"] ?? dept.heading;
        const count = parseInt(deptMeta["count"] ?? "1") || 1;
        const reportsTo = deptMeta["reports_to"];
        const parentId = reportsTo ? makeId(reportsTo) : undefined;

        const context = [identityContext, deptProse].filter(Boolean).join(" ").slice(0, 300);
        const triggerInfo = parseTriggerMeta(deptMeta);

        for (let i = 0; i < count; i++) {
          const displayName = nameFromHeading(dept.heading);
          const agentName = count > 1 ? `${displayName} ${i + 1}` : displayName;
          const agentId = count > 1 ? `${id}-${i + 1}` : id;
          const agent = makeAgent(
            agentId,
            agentName,
            deptRole,
            deptLevel,
            domain,
            parentId,
            context,
            triggerInfo,
            deptMeta["avatar"],
            deptMeta["avatar_color"],
            deptMeta["avatar_url"],
          );
          agents.push(agent);
          if (isCLevel) cooId = agentId;
        }
        continue;
      }

      // Department with sub-roles (H4 children)
      let deptLeadId: string | undefined;

      for (let ri = 0; ri < dept.children.length; ri++) {
        const sub = dept.children[ri];
        if (sub.level !== 4) continue;

        const subMeta = extractMetaFromNodes(sub.content);
        const subProse = extractProseFromNodes(sub.content);
        const subInferred = inferLevelAndRole(sub.heading);
        const subLevel = subMeta["level"]
          ? parseInt(subMeta["level"]) || subInferred.level
          : subInferred.level;
        const subRole = subInferred.role;

        const id = makeId(subMeta["id"] ?? nameFromHeading(sub.heading));
        const domain = subMeta["domain"] ?? dept.heading;
        const count = parseInt(subMeta["count"] ?? "1") || 1;
        const reportsTo = subMeta["reports_to"];

        let parentId: string | undefined;
        if (reportsTo) {
          parentId = makeId(reportsTo);
        } else if (ri === 0) {
          parentId = cooId;
          deptLeadId = count === 1 ? id : `${id}-1`;
        } else {
          parentId = deptLeadId;
        }

        const context = [identityContext, deptProse, subProse]
          .filter(Boolean)
          .join(" ")
          .slice(0, 300);
        const triggerInfo = parseTriggerMeta(subMeta);

        for (let i = 0; i < count; i++) {
          const displayName = nameFromHeading(sub.heading);
          const agentName = count > 1 ? `${displayName} ${i + 1}` : displayName;
          const agentId = count > 1 ? `${id}-${i + 1}` : id;
          const agent = makeAgent(
            agentId,
            agentName,
            subRole,
            subLevel,
            domain,
            parentId,
            context,
            triggerInfo,
            subMeta["avatar"],
            subMeta["avatar_color"],
            subMeta["avatar_url"],
          );
          agents.push(agent);
        }
      }
    }
  }

  // ── Guardrails ──────────────────────────────────────────────────────────
  const guardrailsSection = findSection("Guardrails");
  const guardrails: Guardrail[] = [];

  if (guardrailsSection) {
    for (const child of guardrailsSection.children) {
      if (child.level !== 3) continue;
      const gMeta = extractMetaFromNodes(child.content);
      const validActions: GuardrailAction[] = ["block", "escalate", "require_approval", "warn", "log"];
      const rawAction = (gMeta["action"] ?? "log").toLowerCase() as GuardrailAction;
      const action: GuardrailAction = validActions.includes(rawAction) ? rawAction : "log";
      guardrails.push({
        name: child.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").replace(/^-+/, ""),
        trigger: gMeta["trigger"] ?? "",
        condition: gMeta["condition"],
        match: gMeta["match"],
        action,
        escalate_to: gMeta["escalate_to"],
        message: gMeta["message"] ?? child.heading,
      });
    }
  }

  return { name: orgName, agents, culture, policies, guardrails: guardrails.length > 0 ? guardrails : undefined };
}
