import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for React to hydrate and the hero to appear
    await page.waitForSelector("h1");
  });

  test("page loads and is not blank", async ({ page }) => {
    // The page should have meaningful content, not just an empty body
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    expect(bodyText.length).toBeGreaterThan(100);

    // Nav and footer should be present (rendered by RootLayout)
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("hero section renders with correct content", async ({ page }) => {
    // Main h1 should say "OpenSpawn"
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("OpenSpawn");

    // Tagline — word-by-word reveal (each word is a .tagline-word span inside a <p>)
    // Wait for animation to complete, then verify the aria-label on the wrapping span
    await page.waitForTimeout(1500); // allow wordReveal animations to finish
    await expect(
      page.locator('[aria-label="Your agents. Your devices. Your rules."]')
    ).toBeAttached();
  });

  test("differentiator section renders tagline", async ({ page }) => {
    // "Your agents, your devices, your rules." section
    await expect(
      page.getByRole("heading", {
        name: /your agents.*your devices.*your rules/i,
      })
    ).toBeVisible();
  });

  test("nav links are present and correct", async ({ page }) => {
    const nav = page.locator("nav").first();

    // ORG.md link
    const orgMdLink = nav.getByRole("link", { name: "ORG.md" });
    await expect(orgMdLink).toBeVisible();
    await expect(orgMdLink).toHaveAttribute("href", "/org-md");

    // Docs link
    const docsLink = nav.getByRole("link", { name: "Docs" });
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute("href", "/docs");

    // GitHub link (external)
    const githubLink = nav.getByRole("link", { name: "GitHub" });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/openspawn/openspawn"
    );

    // Live Demo CTA
    const liveDemoLink = nav.getByRole("link", { name: /live demo/i });
    await expect(liveDemoLink).toBeVisible();
    await expect(liveDemoLink).toHaveAttribute(
      "href",
      "https://bikinibottom.ai/app/"
    );
  });

  test("feature cards render all 6 capabilities", async ({ page }) => {
    const expectedFeatures = [
      "Device & Node Orchestration",
      "A2A Protocol",
      "MCP Tools",
      "Model Router",
      "Live Dashboard",
      "Zero-Config CLI",
    ];

    for (const featureName of expectedFeatures) {
      await expect(
        page.getByRole("heading", { name: featureName, exact: true })
      ).toBeVisible();
    }
  });

  test("demo link points to bikinibottom.ai", async ({ page }) => {
    // Multiple links to bikinibottom.ai should exist on the page
    const bikiniLinks = page.locator('a[href="https://bikinibottom.ai/app/"]');
    const count = await bikiniLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Specifically check the "Watch 22 SpongeBob agents" CTA button in hero
    const heroCta = page
      .locator('a[href="https://bikinibottom.ai/app/"]')
      .filter({ hasText: /SpongeBob/i })
      .first();
    await expect(heroCta).toBeVisible();
  });

  test("footer renders with all sections", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Footer brand (the span with the brand name inside the logo area)
    await expect(footer.locator(".gradient-text").first()).toBeVisible();

    // Footer sections
    await expect(
      footer.getByRole("heading", { name: "Product" })
    ).toBeVisible();
    await expect(
      footer.getByRole("heading", { name: "Features" })
    ).toBeVisible();
    await expect(
      footer.getByRole("heading", { name: "Community" })
    ).toBeVisible();

    // Key footer links
    await expect(
      footer.getByRole("link", { name: "Getting Started" })
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: "A2A Protocol" })
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: "GitHub" })
    ).toBeVisible();

    // Copyright notice (span inside the footer bottom bar)
    await expect(
      footer.locator("span").filter({ hasText: /OpenSpawn.*MIT/i }).first()
    ).toBeVisible();
  });

  test("install command snippet is shown in hero", async ({ page }) => {
    // The install command appears in the hero section (may appear in multiple places)
    await expect(
      page.getByText("npx openspawn init my-org").first()
    ).toBeVisible();
  });
});
