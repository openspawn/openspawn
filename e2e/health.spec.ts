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
    
    // Should show dashboard page
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    
    // Should show navigation
    await expect(page.getByText("OpenSpawn").first()).toBeVisible();
    await expect(page.getByText("Tasks").first()).toBeVisible();
    await expect(page.getByText("Agents").first()).toBeVisible();
    await expect(page.getByText("Credits").first()).toBeVisible();
    await expect(page.getByText("Events").first()).toBeVisible();
  });

  test("Can navigate to tasks page", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  });

  test("Can navigate to agents page", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
  });

  test("Can navigate to credits page", async ({ page }) => {
    await page.goto("/credits");
    await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible();
  });

  test("Can navigate to events page", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
  });
});
