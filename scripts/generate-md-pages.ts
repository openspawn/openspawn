/**
 * Generate .md versions of every docs page for AI discoverability.
 *
 * Strategy: Parse TSX files and extract ALL visible text content,
 * preserving structure (headings, paragraphs, lists, code blocks).
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, relative, dirname } from "path";

const WEBSITE_DIR = join(__dirname, "..", "apps", "website");
const ROUTES_DIR = join(WEBSITE_DIR, "app", "routes", "docs");
const OUTPUT_DIR = join(WEBSITE_DIR, "public", "docs");

interface Block {
  type: "heading" | "paragraph" | "list-item" | "code" | "table-row";
  level?: number;
  content: string;
}

function extractBlocks(tsx: string): Block[] {
  const blocks: Block[] = [];

  // Remove imports and component boilerplate
  const jsxMatch = tsx.match(/return\s*\(([\s\S]*)\);\s*\}/);
  const jsx = jsxMatch ? jsxMatch[1] : tsx;

  // Process line by line through the JSX
  const lines = jsx.split("\n");
  let inCodeBlock = false;
  let codeBuffer = "";
  let currentText = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip JSX-only lines
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

    // Headings
    const hMatch = trimmed.match(/<h([1-6])[^>]*>(.*)/);
    if (hMatch) {
      const level = parseInt(hMatch[1]);
      let text = hMatch[2];
      // Handle multi-line headings
      if (!text.includes("</h")) {
        continue; // partial, skip for now
      }
      text = text.replace(/<\/h\d>.*/, "");
      text = stripTags(text);
      if (text.trim()) {
        blocks.push({ type: "heading", level, content: text.trim() });
      }
      continue;
    }

    // Code blocks (pre tags or template literal code)
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

    // List items
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

    // Paragraph text (anything with visible text after stripping tags)
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
      // Accumulate paragraph text
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

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkDir(full));
    } else if (entry.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

// Main
mkdirSync(OUTPUT_DIR, { recursive: true });

const routes = walkDir(ROUTES_DIR);
let generated = 0;

for (const route of routes) {
  const rel = relative(ROUTES_DIR, route).replace(/\.tsx$/, "");
  const routePath = `docs/${rel === "index" ? "" : rel}`;
  const outFile = rel === "index" ? "index.md" : `${rel}.md`;
  const outPath = join(OUTPUT_DIR, outFile);

  const content = readFileSync(route, "utf-8");
  const blocks = extractBlocks(content);
  const md = blocksToMarkdown(blocks, routePath);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, md);
  generated++;

  const blockCount = blocks.length;
  const charCount = md.length;
  console.log(`  ${routePath}.md (${blockCount} blocks, ${charCount} chars)`);
}

console.log(`\n✅ Generated ${generated} .md files in ${OUTPUT_DIR}`);
