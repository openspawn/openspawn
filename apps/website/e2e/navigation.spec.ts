import { test, expect } from "@playwright/test";

/** All routes defined in apps/website/app/route-tree.tsx */
const ALL_ROUTES = [
  { path: "/", expectedHeading: /openspawn/i },
  { path: "/org-md", expectedHeading: /org\.md/i },
  { path: "/docs", expectedHeading: /openspawn/i },
  { path: "/docs/getting-started", expectedHeading: /getting started/i },
  { path: "/docs/how-it-works", expectedHeading: /how it works/i },
  { path: "/docs/openclaw", expectedHeading: /openclaw/i },
  {
    path: "/docs/tutorials/your-first-org-md",
    expectedHeading: /your first org\.md/i,
  },
  { path: "/docs/protocols/a2a", expectedHeading: /a2a/i },
  { path: "/docs/protocols/mcp", expectedHeading: /mcp/i },
  { path: "/docs/features/dashboard", expectedHeading: /dashboard/i },
  { path: "/docs/features/model-router", expectedHeading: /model router/i },
];

test.describe("Route tree — every route renders", () => {
  for (const route of ALL_ROUTES) {
    test(`${route.path} renders (not blank/white)`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForSelector("h1, h2");

      // Page must have meaningful content
      const bodyText = await page.evaluate(
        () => document.body.innerText.trim()
      );
      expect(
        bodyText.length,
        `${route.path} appears blank`
      ).toBeGreaterThan(50);

      // Nav should always render (it's in RootLayout)
      await expect(page.locator("nav").first()).toBeVisible();

      // Footer should always render
      await expect(page.locator("footer")).toBeVisible();

      // Expected heading should be visible
      await expect(
        page.getByRole("heading", { name: route.expectedHeading })
      ).toBeVisible();
    });
  }
});

test.describe("404 — unknown routes", () => {
  test("unknown route shows the 404 not-found page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-at-all");
    await page.waitForSelector("h1");

    // The 404 page shows this badge text
    await expect(page.getByText("404 — Page Not Found")).toBeVisible();

    // And the main headline
    await expect(
      page.getByRole("heading", { name: /lost in the deep end/i })
    ).toBeVisible();
  });

  test("nested unknown route also shows 404", async ({ page }) => {
    await page.goto("/docs/unknown-section/unknown-page");
    await page.waitForSelector("h1");

    await expect(page.getByText("404 — Page Not Found")).toBeVisible();
  });

  test("404 page has working back-to-home link", async ({ page }) => {
    await page.goto("/definitely-not-a-real-page");
    await page.waitForSelector("h1");

    const backLink = page.getByRole("link", { name: /back to home/i });
    await expect(backLink).toBeVisible();

    await backLink.click();
    await page.waitForSelector("h1");

    // Should now be on the landing page
    await expect(page.getByRole("heading", { name: /openspawn/i })).toBeVisible();
  });
});

test.describe("Mobile nav toggle", () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone SE size

  test("hamburger button exists on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav");

    // The hamburger button has aria-label="Toggle menu"
    const hamburger = page.getByRole("button", { name: /toggle menu/i });
    await expect(hamburger).toBeVisible();
  });

  test("clicking hamburger opens mobile nav menu", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav");

    // Desktop nav links should be hidden on mobile
    const desktopNav = page.locator(".md\\:flex");

    // The hamburger menu toggle
    const hamburger = page.getByRole("button", { name: /toggle menu/i });
    await expect(hamburger).toBeVisible();

    // Before clicking: the mobile dropdown should not be visible
    // We check by whether the ORG.md link in the mobile dropdown is visible
    // (The mobile dropdown has class 'md:hidden')
    const mobileMenu = page.locator(".md\\:hidden").filter({
      has: page.getByRole("link", { name: "ORG.md" }),
    });

    await expect(mobileMenu).not.toBeVisible();

    // Click to open
    await hamburger.click();

    // Mobile menu should now be visible
    await expect(mobileMenu).toBeVisible();

    // Nav links should be visible
    await expect(
      mobileMenu.getByRole("link", { name: "ORG.md" })
    ).toBeVisible();
    await expect(
      mobileMenu.getByRole("link", { name: "Docs" })
    ).toBeVisible();
  });

  test("clicking hamburger again closes mobile nav menu", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("nav");

    const hamburger = page.getByRole("button", { name: /toggle menu/i });
    const mobileMenu = page.locator(".md\\:hidden").filter({
      has: page.getByRole("link", { name: "ORG.md" }),
    });

    // Open
    await hamburger.click();
    await expect(mobileMenu).toBeVisible();

    // Close
    await hamburger.click();
    await expect(mobileMenu).not.toBeVisible();
  });
});
