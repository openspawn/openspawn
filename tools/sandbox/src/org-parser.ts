// ── ORG.md Parser ────────────────────────────────────────────────────────────
// Parses an ORG.md file into a ParsedOrg structure for the sandbox
// Uses unified/remark to parse markdown into an AST, then walks the tree.

import { readFileSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import type { Root, Heading, Content, List, ListItem, Paragraph, Text, Strong, PhrasingContent } from 'mdast';
import type { SandboxAgent, ACPMessage } from './types.js';

// Map character names to avatar image files in /avatars/
const AVATAR_FILES: Record<string, string> = {
  'mr. krabs': '/app/avatars/mr-krabs.png',
  'sandy cheeks': '/app/avatars/sandy.png',
  'spongebob squarepants': '/app/avatars/spongebob.png',
  'spongebob': '/app/avatars/spongebob.png',
  'patrick star': '/app/avatars/patrick.png',
  'patrick': '/app/avatars/patrick.png',
  'squidward tentacles': '/app/avatars/squidward.png',
  'squidward': '/app/avatars/squidward.png',
  'pearl krabs': '/app/avatars/pearl.png',
  'pearl': '/app/avatars/pearl.png',
  'gary': '/app/avatars/gary.png',
  'plankton jr.': '/app/avatars/plankton.png',
  'plankton': '/app/avatars/plankton.png',
  'karen': '/app/avatars/karen.png',
  'mermaid man': '/app/avatars/mermaid-man.png',
  'barnacle boy': '/app/avatars/barnacle-boy.png',
  'larry the lobster': '/app/avatars/larry.png',
  'larry': '/app/avatars/larry.png',
  'mrs. puff': '/app/avatars/mrs-puff.png',
  'squilliam fancyson': '/app/avatars/squilliam.png',
  'squilliam': '/app/avatars/squilliam.png',
  'flying dutchman': '/app/avatars/flying-dutchman.png',
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

export interface ParsedOrg {
  name: string;
  agents: SandboxAgent[];
  culture: {
    preset?: string;
    escalationVelocity?: string;
    progressFrequency?: string;
    ackRequired?: boolean;
    maxEscalationDepth?: number;
  };
  policies: {
    perAgentBudget?: number;
    alertThreshold?: number;
    departmentCaps?: Record<string, number>;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
}

function inferLevelAndRole(name: string): { level: number; role: SandboxAgent['role'] } {
  const n = name.toLowerCase();
  if (/\b(coo|cto|ceo)\b/.test(n)) return { level: 10, role: 'coo' };
  if (/\b(cfo|vp|director|talent)\b/.test(n)) return { level: 9, role: 'talent' };
  if (/\b(lead|manager)\b/.test(n)) return { level: 7, role: 'lead' };
  if (/\b(senior|principal)\b/.test(n)) return { level: 6, role: 'senior' };
  if (/\b(junior|intern|assistant)\b/.test(n)) return { level: 1, role: 'intern' };
  return { level: 4, role: 'worker' };
}

/** Extract text content from a phrasing node tree */
function phrasingToText(nodes: PhrasingContent[]): string {
  return nodes.map(n => {
    if (n.type === 'text') return (n as Text).value;
    if ('children' in n) return phrasingToText((n as any).children);
    return '';
  }).join('');
}

/** Extract text from any mdast node */
function nodeToText(node: Content): string {
  if (node.type === 'text') return (node as Text).value;
  if ('children' in node) return (node as any).children.map((c: Content) => nodeToText(c)).join('');
  return '';
}

/** Extract bold-key: value pairs from a list in mdast */
function extractMetaFromList(items: ListItem[]): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const item of items) {
    const text = item.children.map(c => nodeToText(c)).join('').trim();
    const m = text.match(/^(.+?):\s*(.+)$/);
    if (m) {
      const key = m[1].trim().toLowerCase().replace(/\s+/g, '_');
      meta[key] = m[2].trim();
    }
  }
  return meta;
}

/** Extract bold-key metadata from list items: **Key:** Value */
function extractMetaFromNodes(nodes: Content[]): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const node of nodes) {
    if (node.type === 'list') {
      const list = node as List;
      for (const item of list.children) {
        // Get the paragraph inside the list item
        for (const child of item.children) {
          if (child.type === 'paragraph') {
            const para = child as Paragraph;
            // Check if first child is Strong (bold)
            if (para.children.length >= 1 && para.children[0].type === 'strong') {
              const strong = para.children[0] as Strong;
              const keyText = phrasingToText(strong.children);
              // Key ends with ':'
              const key = keyText.replace(/:$/, '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
              // Value is the rest of the paragraph text
              const restText = phrasingToText(para.children.slice(1)).trim().replace(/^\s*/, '');
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
    if (node.type === 'paragraph') {
      parts.push(phrasingToText((node as Paragraph).children));
    }
  }
  return parts.join(' ').trim();
}

const wakeOnMap: Record<string, ACPMessage['type']> = {
  escalations: 'escalation',
  escalation: 'escalation',
  completions: 'completion',
  completion: 'completion',
  delegations: 'delegation',
  delegation: 'delegation',
  orders: 'delegation',
  progress: 'progress',
  ack: 'ack',
  status: 'status_request',
};

function parseTriggerMeta(meta: Record<string, string>): { trigger?: 'polling' | 'event-driven'; triggerOn?: ACPMessage['type'][] } {
  const result: { trigger?: 'polling' | 'event-driven'; triggerOn?: ACPMessage['type'][] } = {};
  if (meta['trigger']) {
    const t = meta['trigger'].toLowerCase().trim();
    if (t === 'event-driven' || t === 'event_driven') result.trigger = 'event-driven';
    else if (t === 'polling') result.trigger = 'polling';
  }
  if (meta['wake_on']) {
    result.triggerOn = meta['wake_on'].split(',').map(s => s.trim().toLowerCase())
      .map(s => wakeOnMap[s]).filter((s): s is ACPMessage['type'] => !!s);
  }
  return result;
}

function makeAgent(
  id: string,
  name: string,
  role: SandboxAgent['role'],
  level: number,
  domain: string,
  parentId: string | undefined,
  systemPrompt: string,
  triggerConfig?: { trigger?: 'polling' | 'event-driven'; triggerOn?: ACPMessage['type'][] },
  avatar?: string,
  avatarColor?: string,
): SandboxAgent {
  const canSpawn = level >= 7;
  const roleInstruction = level >= 7
    ? 'You DELEGATE tasks to your direct reports. Only SPAWN new agents if explicitly asked to hire.'
    : level >= 5
    ? 'You do complex work and can delegate to juniors.'
    : 'You do assigned tasks. Escalate if stuck.';

  const spawnAction = canSpawn
    ? `\n- {"action":"spawn_agent","name":"...","domain":"...","role":"...","reason":"..."}`
    : '';

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

  const defaultTrigger: 'polling' | 'event-driven' = level >= 7 ? 'event-driven' : 'polling';
  const defaultTriggerOn: ACPMessage['type'][] | undefined = level >= 7
    ? ['escalation', 'completion', 'delegation', 'status_request']
    : undefined;

  return {
    id,
    name,
    role,
    level,
    domain,
    avatar,
    avatarColor,
    avatarUrl: nameToAvatarUrl(name),
    parentId,
    status: 'active',
    systemPrompt: fullPrompt,
    taskIds: [],
    recentMessages: [],
    trigger: triggerConfig?.trigger ?? defaultTrigger,
    triggerOn: triggerConfig?.triggerOn ?? defaultTriggerOn,
    inbox: [],
    stats: {
      tasksCompleted: 0,
      tasksFailed: 0,
      messagessSent: 0,
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
    if (node.type === 'heading') {
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
  const raw = readFileSync(filePath, 'utf-8');
  return parseOrgMdContent(raw);
}

export function parseOrgMdContent(raw: string): ParsedOrg {
  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .parse(raw) as Root;

  const sections = buildSectionTree(tree.children as Content[]);

  // Extract org name from first H1
  const h1 = sections.find(s => s.level === 1);
  const orgName = h1?.heading ?? 'Unnamed Org';

  // All H2 sections (either top-level or children of H1)
  const h2Sections = h1 ? h1.children.filter(s => s.level === 2) : sections.filter(s => s.level === 2);

  const findSection = (name: string) =>
    h2Sections.find(s => s.heading.toLowerCase().includes(name.toLowerCase()));

  // ── Identity ───────────────────────────────────────────────────────────
  const identitySection = findSection('Identity');
  const identityContext = identitySection ? extractProseFromNodes(identitySection.content) : '';

  // ── Culture ────────────────────────────────────────────────────────────
  const cultureSection = findSection('Culture');
  const cultureMeta = cultureSection ? extractMetaFromNodes(cultureSection.content) : {};
  // Also check for bare "preset: xxx" in paragraph text
  const cultureText = cultureSection ? cultureSection.content.map(n => nodeToText(n)).join('\n') : '';
  const presetMatch = cultureText.match(/preset:\s*(\w+)/i);
  const culture: ParsedOrg['culture'] = {
    preset: presetMatch?.[1] ?? cultureMeta['preset'],
    escalationVelocity: cultureMeta['escalation'],
    progressFrequency: cultureMeta['progress_updates'] ?? cultureMeta['progress'],
    ackRequired: cultureMeta['ack_required'] ? cultureMeta['ack_required'].toLowerCase() === 'yes' : undefined,
    maxEscalationDepth: cultureMeta['hierarchy_depth']
      ? parseInt(cultureMeta['hierarchy_depth'].replace(/\D/g, '')) || undefined
      : undefined,
  };

  // ── Policies ───────────────────────────────────────────────────────────
  const policiesSection = findSection('Policies');
  const policies: ParsedOrg['policies'] = {};
  if (policiesSection) {
    // Policies has H3 subsections: Budget, Department Caps, Permissions
    const allPolicyContent = [
      ...policiesSection.content,
      ...policiesSection.children.flatMap(c => c.content),
    ];
    const pMeta = extractMetaFromNodes(allPolicyContent);
    if (pMeta['per_agent_limit']) {
      policies.perAgentBudget = parseInt(pMeta['per_agent_limit'].replace(/\D/g, '')) || undefined;
    }
    if (pMeta['alert_threshold']) {
      policies.alertThreshold = parseInt(pMeta['alert_threshold'].replace(/\D/g, '')) || undefined;
    }
    // Parse department caps from list items like "Engineering: max 12 agents"
    const caps: Record<string, number> = {};
    for (const child of policiesSection.children) {
      if (child.heading.toLowerCase().includes('department cap')) {
        for (const node of child.content) {
          if (node.type === 'list') {
            for (const item of (node as List).children) {
              const text = item.children.map(c => nodeToText(c)).join('').trim();
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
  }

  // ── Structure ──────────────────────────────────────────────────────────
  const structureSection = findSection('Structure');
  const agents: SandboxAgent[] = [];

  if (structureSection) {
    let cooId: string | undefined;

    for (const dept of structureSection.children) {
      if (dept.level !== 3) continue;

      const deptMeta = extractMetaFromNodes(dept.content);
      const deptProse = extractProseFromNodes(dept.content);
      const { level: deptLevel, role: deptRole } = inferLevelAndRole(dept.heading);

      const isCLevel = deptLevel >= 10;

      if (isCLevel || dept.children.length === 0) {
        // Direct agent at ### level (C-level or solo)
        const id = makeId(deptMeta['id'] ?? dept.heading);
        const domain = deptMeta['domain'] ?? dept.heading;
        const count = parseInt(deptMeta['count'] ?? '1') || 1;
        const reportsTo = deptMeta['reports_to'];
        const parentId = reportsTo ? makeId(reportsTo) : undefined;

        const context = [identityContext, deptProse].filter(Boolean).join(' ').slice(0, 300);
        const triggerInfo = parseTriggerMeta(deptMeta);

        for (let i = 0; i < count; i++) {
          const agentName = count > 1 ? `${dept.heading} ${i + 1}` : dept.heading;
          const agentId = count > 1 ? `${id}-${i + 1}` : id;
          const agent = makeAgent(agentId, agentName, deptRole, deptLevel, domain, parentId, context, triggerInfo, deptMeta['avatar'], deptMeta['avatar_color']);
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
        const { level: subLevel, role: subRole } = inferLevelAndRole(sub.heading);

        const id = makeId(subMeta['id'] ?? sub.heading);
        const domain = subMeta['domain'] ?? dept.heading;
        const count = parseInt(subMeta['count'] ?? '1') || 1;
        const reportsTo = subMeta['reports_to'];

        let parentId: string | undefined;
        if (reportsTo) {
          parentId = makeId(reportsTo);
        } else if (ri === 0) {
          parentId = cooId;
          deptLeadId = count === 1 ? id : `${id}-1`;
        } else {
          parentId = deptLeadId;
        }

        const context = [identityContext, deptProse, subProse].filter(Boolean).join(' ').slice(0, 300);
        const triggerInfo = parseTriggerMeta(subMeta);

        for (let i = 0; i < count; i++) {
          const agentName = count > 1 ? `${sub.heading} ${i + 1}` : sub.heading;
          const agentId = count > 1 ? `${id}-${i + 1}` : id;
          const agent = makeAgent(agentId, agentName, subRole, subLevel, domain, parentId, context, triggerInfo, subMeta['avatar'], subMeta['avatar_color']);
          agents.push(agent);
        }
      }
    }
  }

  return { name: orgName, agents, culture, policies };
}
