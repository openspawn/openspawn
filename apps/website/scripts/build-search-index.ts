/**
 * Build-time script: reads all .mdx files in content/docs/, extracts text,
 * and outputs a JSON index to public/search-index.json for Orama client-side search.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "fs";
import { join, relative } from "path";

const CONTENT_DIR = join(__dirname, "..", "content", "docs");
const OUTPUT = join(__dirname, "..", "public", "search-index.json");

interface IndexEntry {
  title: string;
  path: string;
  content: string;
  section: string;
}

function walkMdx(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkMdx(full));
    } else if (entry.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

function extractTitle(content: string): string {
  // Check frontmatter title
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*["']?(.+?)["']?\n[\s\S]*?---/);
  if (fmMatch) return fmMatch[1];
  // Check first h1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1];
  return "Untitled";
}

function extractSection(relPath: string): string {
  const parts = relPath.split("/");
  if (parts.length > 1) return parts[0];
  return "general";
}

function stripMarkdown(content: string): string {
  return content
    .replace(/^---\n[\s\S]*?---\n/, "") // frontmatter
    .replace(/^import\s+.*$/gm, "") // imports
    .replace(/^export\s+.*$/gm, "") // exports
    .replace(/<[^>]+>/g, " ") // JSX/HTML tags
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]+`/g, " ") // inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/#{1,6}\s+/g, "") // heading markers
    .replace(/[*_~]+/g, "") // bold/italic/strikethrough
    .replace(/\|.*\|/g, " ") // table rows
    .replace(/\n{3,}/g, "\n\n") // collapse blank lines
    .replace(/\s+/g, " ")
    .trim();
}

// Main
try {
  const mdxFiles = walkMdx(CONTENT_DIR);
  const entries: IndexEntry[] = [];

  for (const file of mdxFiles) {
    const raw = readFileSync(file, "utf-8");
    const rel = relative(CONTENT_DIR, file).replace(/\.mdx$/, "");
    const routePath = `/docs/${rel}`;
    const section = extractSection(rel);
    const title = extractTitle(raw);
    const content = stripMarkdown(raw);

    entries.push({ title, path: routePath, content, section });
  }

  mkdirSync(join(__dirname, "..", "public"), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(entries, null, 2));
  console.log(`Search index: ${entries.length} pages indexed → ${OUTPUT}`);
} catch (err) {
  console.error("Search index build failed:", err);
  // Non-fatal — search will degrade gracefully
  writeFileSync(OUTPUT, "[]");
}
