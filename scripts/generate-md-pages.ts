/**
 * Generate .md versions of every docs page for AI discoverability.
 *
 * Handles two content sources:
 * - TSX pages in apps/website/app/routes/docs/ (existing JSX doc pages)
 * - MDX pages in apps/website/content/docs/ (migrated from Starlight)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, relative, dirname } from "path";

const WEBSITE_DIR = join(__dirname, "..", "apps", "website");
const ROUTES_DIR = join(WEBSITE_DIR, "app", "routes", "docs");
const CONTENT_DIR = join(WEBSITE_DIR, "content", "docs");
const OUTPUT_DIR = join(WEBSITE_DIR, "public", "docs");

interface Block {
  type: "heading" | "paragraph" | "list-item" | "code" | "table-row";
  level?: number;
  content: string;
}

// ─── TSX extraction (existing logic) ─────────────────────────────────────────

function extractBlocks(tsx: string): Block[] {
  const blocks: Block[] = [];

  const jsxMatch = tsx.match(/return\s*\(([\s\S]*)\);\s*\}/);
  const jsx = jsxMatch ? jsxMatch[1] : tsx;

  const lines = jsx.split("\n");
  let inCodeBlock = false;
  let codeBuffer = "";
  let currentText = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export ") ||
      trimmed.startsWith("const ") ||
      trimmed.startsWith("function ") ||
      trimmed === "return (" ||
      trimmed === ");" ||
      trimmed === "}" ||
      trimmed.startsWith("className=") ||
      trimmed === ""
    )
      continue;

    const hMatch = trimmed.match(/<h([1-6])[^>]*>(.*)/);
    if (hMatch) {
      const level = parseInt(hMatch[1]);
      let text = hMatch[2];
      if (!text.includes("</h")) {
        continue;
      }
      text = text.replace(/<\/h\d>.*/, "");
      text = stripTags(text);
      if (text.trim()) {
        blocks.push({ type: "heading", level, content: text.trim() });
      }
      continue;
    }

    if (trimmed.includes("<pre") || trimmed.includes("<CodeBlock") || trimmed.includes("```")) {
      inCodeBlock = true;
      codeBuffer = "";
      continue;
    }
    if (
      inCodeBlock &&
      (trimmed.includes("</pre>") || trimmed.includes("</CodeBlock>") || trimmed === "```")
    ) {
      inCodeBlock = false;
      if (codeBuffer.trim()) {
        blocks.push({ type: "code", content: codeBuffer.trim() });
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer += stripTags(trimmed) + "\n";
      continue;
    }

    const liMatch = trimmed.match(/<li[^>]*>(.*?)(<\/li>)?/);
    if (liMatch) {
      let text = liMatch[1];
      if (liMatch[2]) text = text.replace(/<\/li>/, "");
      text = stripTags(text);
      if (text.trim()) {
        blocks.push({ type: "list-item", content: text.trim() });
      }
      continue;
    }

    const text = stripTags(trimmed);
    if (
      text.length > 3 &&
      !text.startsWith("{") &&
      !text.match(/^[</{}]/) &&
      !text.includes("className") &&
      !text.includes("onClick") &&
      !text.includes("useState") &&
      !text.includes("motion.")
    ) {
      if (currentText && !trimmed.startsWith("<")) {
        currentText += " " + text;
      } else {
        if (currentText) {
          blocks.push({ type: "paragraph", content: currentText });
        }
        currentText = text;
      }
    }
  }

  if (currentText) {
    blocks.push({ type: "paragraph", content: currentText });
  }

  return blocks;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\{\/\*.*?\*\/\}/g, "")
    .replace(/\{["'`]([^"'`]*)["'`]\}/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\{`/g, "")
    .replace(/`\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function blocksToMarkdown(blocks: Block[], routePath: string): string {
  const lines = [
    "---",
    `source: https://openspawn.ai/${routePath}`,
    `generated: ${new Date().toISOString().split("T")[0]}`,
    "---",
    "",
  ];

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        lines.push(`${"#".repeat(block.level || 2)} ${block.content}\n`);
        break;
      case "paragraph":
        if (block.content.length > 5) lines.push(`${block.content}\n`);
        break;
      case "list-item":
        lines.push(`- ${block.content}`);
        break;
      case "code":
        lines.push("```", block.content, "```\n");
        break;
    }
  }

  return lines.join("\n");
}

// ─── MDX extraction ──────────────────────────────────────────────────────────

function mdxToMarkdown(content: string, routePath: string): string {
  let md = content
    // Strip YAML frontmatter
    .replace(/^---\n[\s\S]*?---\n/, "")
    // Strip JSX/ESM imports
    .replace(/^import\s+.*$/gm, "")
    // Strip JSX/ESM exports (but not export default)
    .replace(/^export\s+(?!default).*$/gm, "")
    // Strip JSX components (self-closing and opening/closing)
    .replace(/<[A-Z][a-zA-Z]*\s[^>]*\/>/g, "")
    .replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, "")
    // Clean up excessive blank lines
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

  const header = [
    "---",
    `source: https://openspawn.ai/${routePath}`,
    `generated: ${new Date().toISOString().split("T")[0]}`,
    "---",
    "",
  ].join("\n");

  return header + md + "\n";
}

// ─── File walking ────────────────────────────────────────────────────────────

function walkDir(dir: string, ext: string): string[] {
  const files: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        files.push(...walkDir(full, ext));
      } else if (entry.endsWith(ext)) {
        files.push(full);
      }
    }
  } catch {
    // Directory may not exist yet
  }
  return files;
}

// ─── Main ────────────────────────────────────────────────────────────────────

mkdirSync(OUTPUT_DIR, { recursive: true });

let generated = 0;

// Process TSX doc pages
const tsxRoutes = walkDir(ROUTES_DIR, ".tsx");
for (const route of tsxRoutes) {
  const rel = relative(ROUTES_DIR, route).replace(/\.tsx$/, "");
  const routePath = `docs/${rel === "index" ? "" : rel}`;
  const outFile = rel === "index" ? "index.md" : `${rel}.md`;
  const outPath = join(OUTPUT_DIR, outFile);

  const content = readFileSync(route, "utf-8");

  // Skip thin MDX wrappers (they just import from content/docs/)
  if (content.includes("MdxDocPage") || content.includes("mdx-provider")) {
    continue;
  }

  const blocks = extractBlocks(content);
  const md = blocksToMarkdown(blocks, routePath);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, md);
  generated++;

  const blockCount = blocks.length;
  const charCount = md.length;
  console.log(`  ${routePath}.md (${blockCount} blocks, ${charCount} chars) [tsx]`);
}

// Process MDX content pages
const mdxFiles = walkDir(CONTENT_DIR, ".mdx");
for (const file of mdxFiles) {
  const rel = relative(CONTENT_DIR, file).replace(/\.mdx$/, "");
  const routePath = `docs/${rel}`;
  const outFile = `${rel}.md`;
  const outPath = join(OUTPUT_DIR, outFile);

  const content = readFileSync(file, "utf-8");
  const md = mdxToMarkdown(content, routePath);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, md);
  generated++;

  const charCount = md.length;
  console.log(`  ${routePath}.md (${charCount} chars) [mdx]`);
}

console.log(`\nGenerated ${generated} .md files in ${OUTPUT_DIR}`);
