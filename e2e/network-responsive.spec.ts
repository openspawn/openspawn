import { test, expect } from "@playwright/test";

const viewports = [
  { name: "Mobile S", width: 320, height: 568 },
  { name: "Mobile M", width: 375, height: 667 },
  { name: "Mobile L", width: 425, height: 812 },
  { name: "Mobile Landscape", width: 667, height: 375 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Tablet Landscape", width: 1024, height: 768 },
  { name: "Laptop", width: 1366, height: 768 },
  { name: "Desktop", width: 1440, height: 900 },
];

test.describe("Network page responsive tests", () => {
  for (const viewport of viewports) {
    test(`renders correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/network");
      
      // Wait for the React Flow canvas to load
      await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10000 });
      
      // Check if landscape mobile (legend hidden for better space)
      const isLandscapeMobile = viewport.height < 500 && viewport.width > viewport.height;
      
      if (!isLandscapeMobile) {
        // Verify the legend is visible (hidden in landscape mobile)
        await expect(page.getByText("Levels")).toBeVisible();
      }
      
      // Verify the graph canvas rendered
      await expect(page.locator(".react-flow__viewport")).toBeVisible();
      
      // Verify at least one agent node is visible (Agent Dennis in the graph)
      await expect(page.locator(".react-flow").getByText("Agent Dennis")).toBeVisible();
      
      // Take a screenshot for visual verification
      await page.screenshot({ 
        path: `e2e/screenshots/network-${viewport.name.toLowerCase().replace(" ", "-")}.png`,
        fullPage: false 
      });
    });
  }

  test("node click shows details panel on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/network");
    
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10000 });
    
    // Click on Agent Dennis node within the graph
    await page.locator(".react-flow").getByText("Agent Dennis").click();
    
    // Details panel should appear with agent info
    await expect(page.getByText("Level 10 COO")).toBeVisible();
    
    // Close button should work
    await page.getByRole("button", { name: "✕" }).click();
    await expect(page.getByText("Level 10 COO")).not.toBeVisible();
  });

  test("node click shows details panel on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/network");
    
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10000 });
    
    // Click on Tech Talent node
    await page.locator(".react-flow").getByText("Tech Talent").click();
    
    // Details panel should appear with HR info
    await expect(page.getByText("Level 9 HR")).toBeVisible();
  });

  test("zoom controls work", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/network");
    
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10000 });
    
    // React Flow controls should be present
    await expect(page.locator(".react-flow__controls")).toBeVisible();
    
    // Zoom in button
    await page.locator(".react-flow__controls-zoomin").click();
    
    // Zoom out button  
    await page.locator(".react-flow__controls-zoomout").click();
    
    // Fit view button
    await page.locator(".react-flow__controls-fitview").click();
  });

  test("legend shows level colors", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/network");
    
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10000 });
    
    // Check legend items using the legend container
    const legend = page.locator("text=Levels").locator("..");
    await expect(legend.getByText("L10")).toBeVisible();
    await expect(legend.getByText("L9")).toBeVisible();
    await expect(legend.getByText("L7-8")).toBeVisible();
  });

  test("stats bar is present", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/network");
    
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10000 });
    
    // Stats bar should be visible at bottom - check for the rounded container
    await expect(page.locator(".rounded-2xl, .rounded-full").filter({ hasText: "Active" })).toBeVisible();
    await expect(page.locator(".rounded-2xl, .rounded-full").filter({ hasText: "Pending" })).toBeVisible();
  });

  test("multiple agent nodes are visible", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/network");
    
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10000 });
    
    // Check various agents are rendered
    const graph = page.locator(".react-flow");
    await expect(graph.getByText("Human")).toBeVisible();
    await expect(graph.getByText("Agent Dennis")).toBeVisible();
    await expect(graph.getByText("Tech Talent")).toBeVisible();
    await expect(graph.getByText("Finance Talent")).toBeVisible();
    await expect(graph.getByText("Marketing Talent")).toBeVisible();
  });
});
