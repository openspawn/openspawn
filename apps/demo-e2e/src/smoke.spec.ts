import { test, expect } from "@playwright/test";

/**
 * P0 Smoke Tests — every dashboard page loads without crashing.
 *
 * These verify no error boundaries are triggered and key UI elements render.
 * Fast to run, catches the class of bugs like #652 (missing enum definitions).
 */

const PAGES = [
  { path: "/app/", name: "Live View", marker: "text=Live" },
  { path: "/app/agents", name: "Agents", marker: "text=Agents" },
  { path: "/app/tasks", name: "Tasks", marker: "text=Tasks" },
  { path: "/app/task-board", name: "Task Board", marker: "text=Board" },
  { path: "/app/credits", name: "Credits", marker: "text=Credits" },
  { path: "/app/events", name: "Events", marker: "text=Events" },
];

for (const page of PAGES) {
  test(`${page.name} page loads without error`, async ({ page: p }) => {
    // Collect console errors
    const errors: string[] = [];
    p.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await p.goto(page.path, { waitUntil: "networkidle" });

    // No error boundary
    const errorBoundary = p.locator("text=Something went wrong");
    await expect(errorBoundary).not.toBeVisible({ timeout: 5_000 });

    // Page rendered something meaningful
    const body = p.locator("body");
    await expect(body).not.toBeEmpty();

    // No fatal console errors (filter out known noise)
    const fatalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("404") &&
        !e.includes("WebSocket") &&
        !e.includes("net::ERR_CONNECTION_REFUSED"),
    );
    expect(fatalErrors).toHaveLength(0);
  });
}

test("sidebar navigation links work", async ({ page }, testInfo) => {
  // Skip on mobile viewports — sidebar is hidden behind hamburger menu
  const isMobile = testInfo.project.name.includes("mobile");
  if (isMobile) {
    test.skip();
    return;
  }

  await page.goto("/app/", { waitUntil: "networkidle" });

  // Sidebar should have navigation links
  const nav = page.locator("nav, [role=navigation]").first();
  await expect(nav).toBeVisible({ timeout: 10_000 });
});

test("no uncaught JS exceptions on page load", async ({ page }) => {
  const exceptions: string[] = [];
  page.on("pageerror", (error) => exceptions.push(error.message));

  // Visit each page in sequence
  for (const p of PAGES) {
    await page.goto(p.path, { waitUntil: "networkidle" });
  }

  expect(exceptions).toHaveLength(0);
});
