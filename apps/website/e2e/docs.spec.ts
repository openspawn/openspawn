import { test, expect } from "@playwright/test";

/** Sidebar links that must always appear in the docs sidebar */
const SIDEBAR_LINKS = [
  { label: "Overview", href: "/docs" },
  { label: "Getting Started", href: "/docs/getting-started" },
  { label: "How It Works", href: "/docs/how-it-works" },
  { label: "OpenClaw Integration", href: "/docs/openclaw" },
  { label: "Your First ORG.md", href: "/docs/tutorials/your-first-org-md" },
  { label: "Connecting Real Agents", href: "/docs/guides/connecting-agents" },
  { label: "Dashboard Guide", href: "/docs/guides/dashboard-guide" },
  { label: "ACP vs A2A", href: "/docs/concepts/acp-vs-a2a" },
  { label: "A2A Protocol", href: "/docs/protocols/a2a" },
  { label: "MCP Tools", href: "/docs/protocols/mcp" },
  { label: "Dashboard", href: "/docs/features/dashboard" },
  { label: "Model Router", href: "/docs/features/model-router" },
];

test.describe("Docs — Getting Started page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/docs/getting-started");
    await page.waitForSelector("h1");
  });

  test("loads and has content", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Getting Started with OpenSpawn",
        level: 1,
      }),
    ).toBeVisible();

    // Should have a meaningful amount of text content
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    expect(bodyText.length).toBeGreaterThan(500);
  });

  test("sidebar nav renders with all expected links", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    for (const { label } of SIDEBAR_LINKS) {
      await expect(sidebar.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("has prev/next navigation", async ({ page }) => {
    // Getting Started is the 2nd page in the flat list, so it should have
    // a "Previous" (Overview) and "Next" (How It Works) link
    const prevNext = page.locator('nav[class*="border-t"]').or(page.locator('[class*="mt-16"]'));
    await expect(prevNext.getByText("← Previous")).toBeVisible();
    await expect(prevNext.getByText("Next →")).toBeVisible();
  });
});

test.describe("Docs — How It Works page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/docs/how-it-works");
    await page.waitForSelector("h1");
  });

  test("loads and has content", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "How It Works", level: 1 })).toBeVisible();

    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    expect(bodyText.length).toBeGreaterThan(300);
  });

  test("sidebar nav renders with all expected links", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    for (const { label } of SIDEBAR_LINKS) {
      await expect(sidebar.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("has prev/next navigation", async ({ page }) => {
    const prevText = page.getByText("← Previous");
    const nextText = page.getByText("Next →");
    await expect(prevText).toBeVisible();
    await expect(nextText).toBeVisible();
  });
});

test.describe("Docs — Your First ORG.md tutorial", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/docs/tutorials/your-first-org-md");
    await page.waitForSelector("h1");
  });

  test("loads and has content", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Your First ORG.md", level: 1 })).toBeVisible();

    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    expect(bodyText.length).toBeGreaterThan(300);
  });

  test("sidebar nav renders", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // Tutorial entry itself should be highlighted/active
    await expect(sidebar.getByRole("link", { name: "Your First ORG.md" })).toBeVisible();
  });

  test("has prev/next navigation", async ({ page }) => {
    await expect(page.getByText("← Previous")).toBeVisible();
    // May or may not have next, but should have prev
  });
});

test.describe("Docs — Connecting Real Agents page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/docs/guides/connecting-agents");
    await page.waitForSelector("h1");
  });

  test("loads and has content", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Connecting Real Agents", level: 1 }),
    ).toBeVisible();

    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    expect(bodyText.length).toBeGreaterThan(500);
  });

  test("sidebar nav renders with all expected links", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    for (const { label } of SIDEBAR_LINKS) {
      await expect(sidebar.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("has prev/next navigation", async ({ page }) => {
    await expect(page.getByText("← Previous")).toBeVisible();
    await expect(page.getByText("Next →")).toBeVisible();
  });
});

test.describe("Docs — Dashboard Guide page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/docs/guides/dashboard-guide");
    await page.waitForSelector("h1");
  });

  test("loads and has content", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard Guide", level: 1 })).toBeVisible();

    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    expect(bodyText.length).toBeGreaterThan(500);
  });

  test("sidebar nav renders with all expected links", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    for (const { label } of SIDEBAR_LINKS) {
      await expect(sidebar.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("has prev/next navigation", async ({ page }) => {
    await expect(page.getByText("← Previous")).toBeVisible();
    await expect(page.getByText("Next →")).toBeVisible();
  });
});

test.describe("Docs — ACP vs A2A page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/docs/concepts/acp-vs-a2a");
    await page.waitForSelector("h1");
  });

  test("loads and has content", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "ACP vs A2A", level: 1 })).toBeVisible();

    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    expect(bodyText.length).toBeGreaterThan(500);
  });

  test("sidebar nav renders with all expected links", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    for (const { label } of SIDEBAR_LINKS) {
      await expect(sidebar.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("has prev/next navigation", async ({ page }) => {
    await expect(page.getByText("← Previous")).toBeVisible();
    await expect(page.getByText("Next →")).toBeVisible();
  });
});

test.describe("Docs — all internal links resolve", () => {
  test("no internal links on the docs index return 404", async ({ page }) => {
    await page.goto("/docs");
    await page.waitForSelector("h1");

    // Collect all internal hrefs from the sidebar + content
    const hrefs = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href]"));
      return links
        .map((a) => (a as HTMLAnchorElement).getAttribute("href"))
        .filter((h): h is string => !!h && h.startsWith("/"));
    });

    const uniqueHrefs = [...new Set(hrefs)];
    expect(uniqueHrefs.length).toBeGreaterThan(0);

    // Navigate to each internal link and verify the 404 page is NOT shown
    for (const href of uniqueHrefs) {
      await page.goto(href);
      await page.waitForLoadState("domcontentloaded");

      // 404 page shows "404 — Page Not Found" text
      const is404 = await page
        .getByText("404 — Page Not Found")
        .isVisible()
        .catch(() => false);

      expect(is404, `Expected ${href} to not be a 404`).toBe(false);
    }
  });

  test("prev/next links on docs pages all resolve to real pages", async ({ page }) => {
    // Walk each docs page and click Next until we reach the end
    await page.goto("/docs");
    await page.waitForSelector("h1");

    let visited = 0;
    const maxPages = 15; // safety guard

    while (visited < maxPages) {
      const nextLink = page.getByText("Next →").locator("..");
      const hasNext = await nextLink.isVisible().catch(() => false);
      if (!hasNext) break;

      await nextLink.click();
      await page.waitForSelector("h1");
      visited++;

      // Ensure we're on a real page, not 404
      const is404 = await page
        .getByText("404 — Page Not Found")
        .isVisible()
        .catch(() => false);
      expect(is404).toBe(false);
    }

    // We should have visited at least a few pages
    expect(visited).toBeGreaterThan(0);
  });
});
