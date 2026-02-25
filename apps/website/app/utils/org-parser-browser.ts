// ── ORG.md Browser Parser ────────────────────────────────────────────────────
// A lightweight, browser-compatible parser for ORG.md files.
// Derives from the sandbox org-parser but runs entirely client-side
// (no Node.js `fs` dependency).
//
// Returns a simplified ParsedOrgPreview suitable for live preview UIs.

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
  PhrasingContent,
} from "mdast";

// ── Public types ─────────────────────────────────────────────────────────────

export interface OrgPreviewAgent {
  id: string;
  name: string;
  role: string;
  level: number;
  department: string;
  parentId?: string;
  count: number;
}

export interface OrgPreview {
  name: string;
  description: string;
  culture: {
    preset?: string;
    escalation?: string;
    progressUpdates?: string;
  };
  departments: Array<{
    name: string;
    agents: OrgPreviewAgent[];
  }>;
  agentCount: number;
  errors: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
}

function nameFromHeading(heading: string): string {
  const dashIdx = heading.indexOf(" — ");
  return dashIdx > 0 ? heading.slice(0, dashIdx).trim() : heading;
}

function roleFromHeading(heading: string): string {
  const dashIdx = heading.indexOf(" — ");
  return dashIdx > 0 ? heading.slice(dashIdx + 3).trim() : "";
}

function inferLevel(nameAndRole: string): number {
  const n = nameAndRole.toLowerCase();
  if (/\b(ceo|cto|coo|cfo|chief)\b/.test(n)) return 10;
  if (/\b(vp|vice president|director)\b/.test(n)) return 9;
  if (/\b(lead|manager|head)\b/.test(n)) return 7;
  if (/\b(senior|principal|sr\.?)\b/.test(n)) return 6;
  if (/\b(junior|intern|jr\.?|assistant)\b/.test(n)) return 1;
  return 4;
}

function phrasingToText(nodes: PhrasingContent[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return (n as Text).value;
      if ("children" in n) return phrasingToText((n as any).children);
      return "";
    })
    .join("");
}

function nodeToText(node: Content): string {
  if (node.type === "text") return (node as Text).value;
  if ("children" in node)
    return (node as any).children.map((c: Content) => nodeToText(c)).join("");
  return "";
}

/** Extract **Key:** Value metadata from list nodes */
function extractMeta(nodes: Content[]): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const node of nodes) {
    if (node.type === "list") {
      for (const item of (node as List).children) {
        for (const child of item.children) {
          if (child.type === "paragraph") {
            const para = child as Paragraph;
            // Bold key: value
            if (para.children[0]?.type === "strong") {
              const key = phrasingToText((para.children[0] as any).children)
                .replace(/:$/, "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "_");
              const rest = phrasingToText(para.children.slice(1)).trim();
              if (key && rest) meta[key] = rest;
            }
            // Bare "Key: value" text
            else {
              const text = phrasingToText(para.children);
              const m = text.match(/^(.+?):\s*(.+)$/);
              if (m) {
                const key = m[1].trim().toLowerCase().replace(/\s+/g, "_");
                meta[key] = m[2].trim();
              }
            }
          }
        }
      }
    }
  }
  return meta;
}

// ── AST section tree ──────────────────────────────────────────────────────────

interface AstSection {
  heading: string;
  level: number;
  content: Content[];
  children: AstSection[];
}

function buildSectionTree(nodes: Content[]): AstSection[] {
  const root: AstSection[] = [];
  const stack: AstSection[] = [];

  for (const node of nodes) {
    if (node.type === "heading") {
      const h = node as Heading;
      const heading = phrasingToText(h.children);
      const section: AstSection = {
        heading,
        level: h.depth,
        content: [],
        children: [],
      };

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

function extractProse(nodes: Content[]): string {
  return nodes
    .filter((n) => n.type === "paragraph")
    .map((n) => phrasingToText((n as Paragraph).children))
    .join(" ")
    .trim();
}

// ── Main parser ──────────────────────────────────────────────────────────────

export function parseOrgMdBrowser(raw: string): OrgPreview {
  const errors: string[] = [];

  try {
    const tree = unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ["yaml"])
      .parse(raw) as Root;

    const sections = buildSectionTree(tree.children as Content[]);

    // Org name from H1
    const h1 = sections.find((s) => s.level === 1);
    const orgName = h1?.heading ?? "Unnamed Org";

    // All H2 sections
    const h2s = h1
      ? h1.children.filter((s) => s.level === 2)
      : sections.filter((s) => s.level === 2);

    const findH2 = (name: string) =>
      h2s.find((s) => s.heading.toLowerCase().includes(name.toLowerCase()));

    // Identity / description
    const identitySection = findH2("Identity") ?? findH2("Mission");
    const description = identitySection
      ? extractProse(identitySection.content)
      : "";

    // Culture
    const cultureSection = findH2("Culture");
    const cultureMeta = cultureSection
      ? extractMeta(cultureSection.content)
      : {};
    // Also handle simple dash list items like "- preset: move-fast"
    const cultureText = cultureSection
      ? cultureSection.content.map((n) => nodeToText(n)).join("\n")
      : "";
    const presetMatch = cultureText.match(/preset:\s*(\S+)/i);

    const culture = {
      preset: presetMatch?.[1] ?? cultureMeta["preset"],
      escalation:
        cultureMeta["escalation"] ?? cultureMeta["escalation_velocity"],
      progressUpdates:
        cultureMeta["progress_updates"] ?? cultureMeta["progress"],
    };

    // Structure
    const structureSection = findH2("Structure") ?? findH2("Team");
    const departments: OrgPreview["departments"] = [];
    let totalAgentCount = 0;

    if (structureSection) {
      for (const dept of structureSection.children) {
        if (dept.level !== 3) continue;

        const deptAgents: OrgPreviewAgent[] = [];
        let deptLeadId: string | undefined;

        // If no H4 children, dept itself is an agent
        if (dept.children.filter((c) => c.level === 4).length === 0) {
          const meta = extractMeta(dept.content);
          const name = nameFromHeading(dept.heading);
          const role = roleFromHeading(dept.heading);
          const level =
            parseInt(meta["level"] ?? "") || inferLevel(dept.heading);
          const count = parseInt(meta["count"] ?? "1") || 1;
          const id = makeId(meta["id"] ?? name);

          for (let i = 0; i < count; i++) {
            const agentId = count > 1 ? `${id}-${i + 1}` : id;
            const agentName = count > 1 ? `${name} ${i + 1}` : name;
            deptAgents.push({
              id: agentId,
              name: agentName,
              role: role || dept.heading,
              level,
              department: dept.heading,
              count,
            });
            totalAgentCount++;
          }
        } else {
          // H4 children are the agents
          for (let ri = 0; ri < dept.children.length; ri++) {
            const sub = dept.children[ri];
            if (sub.level !== 4) continue;

            const meta = extractMeta(sub.content);
            const name = nameFromHeading(sub.heading);
            const role = roleFromHeading(sub.heading);
            const level =
              parseInt(meta["level"] ?? "") || inferLevel(sub.heading);
            const count = parseInt(meta["count"] ?? "1") || 1;
            const id = makeId(meta["id"] ?? name);
            const reportsTo = meta["reports_to"];

            let parentId: string | undefined;
            if (reportsTo) {
              parentId = makeId(reportsTo);
            } else if (ri === 0) {
              deptLeadId = count === 1 ? id : `${id}-1`;
            } else {
              parentId = deptLeadId;
            }

            for (let i = 0; i < count; i++) {
              const agentId = count > 1 ? `${id}-${i + 1}` : id;
              const agentName = count > 1 ? `${name} ${i + 1}` : name;
              deptAgents.push({
                id: agentId,
                name: agentName,
                role: role || sub.heading,
                level,
                department: dept.heading,
                parentId: count > 1 && i > 0 ? deptLeadId : parentId,
                count,
              });
              totalAgentCount++;
            }
          }
        }

        if (deptAgents.length > 0) {
          departments.push({ name: dept.heading, agents: deptAgents });
        }
      }
    } else {
      errors.push('No "Structure" or "Team" section found.');
    }

    if (totalAgentCount === 0 && errors.length === 0) {
      errors.push("No agents found. Add a ## Structure section with ### agents.");
    }

    return {
      name: orgName,
      description,
      culture,
      departments,
      agentCount: totalAgentCount,
      errors,
    };
  } catch (err) {
    return {
      name: "Parse Error",
      description: "",
      culture: {},
      departments: [],
      agentCount: 0,
      errors: [String(err)],
    };
  }
}
