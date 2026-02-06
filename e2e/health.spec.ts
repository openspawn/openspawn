import { test, expect } from "@playwright/test";

test.describe("API Health", () => {
  test("API returns healthy status", async ({ request }) => {
    const response = await request.get("http://localhost:3000/health");
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.status).toBe("ok");
  });
});

test.describe("Dashboard", () => {
  test("Dashboard loads and shows navigation", async ({ page }) => {
    await page.goto("/");
    
    // Should redirect to /tasks
    await expect(page).toHaveURL(/.*tasks/);
    
    // Should show navigation
    await expect(page.getByText("OpenSpawn")).toBeVisible();
    await expect(page.getByText("Tasks")).toBeVisible();
    await expect(page.getByText("Agents")).toBeVisible();
    await expect(page.getByText("Credits")).toBeVisible();
    await expect(page.getByText("Events")).toBeVisible();
  });

  test("Can navigate to agents page", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
  });

  test("Can navigate to events page", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { name: "Activity Feed" })).toBeVisible();
  });
});
