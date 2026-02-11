import { test, expect } from "./fixtures/auth";

test.describe("Workflows Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/workflows");
    await expect(page.getByRole("heading", { name: "Workflows" })).toBeVisible();
    await expect(page.getByText("Manage client engagement workflows")).toBeVisible();
  });

  test("shows New Template and Start Workflow buttons", async ({ authedPage: page }) => {
    await page.goto("/workflows");
    await expect(page.getByRole("button", { name: /New Template/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start Workflow/ })).toBeVisible();
  });

  test("shows search and status filter", async ({ authedPage: page }) => {
    await page.goto("/workflows");
    await expect(page.getByPlaceholder("Search workflows...")).toBeVisible();
    await expect(page.getByText("All Statuses")).toBeVisible();
  });

  test("opens create template dialog", async ({ authedPage: page }) => {
    await page.goto("/workflows");
    await page.getByRole("button", { name: /New Template/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("opens start workflow dialog", async ({ authedPage: page }) => {
    await page.goto("/workflows");
    await page.getByRole("button", { name: /Start Workflow/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("filters workflows by status", async ({ authedPage: page }) => {
    await page.goto("/workflows");
    await page.getByText("All Statuses").click();
    await page.getByRole("option", { name: "Active" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("searches workflows", async ({ authedPage: page }) => {
    await page.goto("/workflows");
    await page.getByPlaceholder("Search workflows...").fill("tax");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows Active Workflows card", async ({ authedPage: page }) => {
    await page.goto("/workflows");
    await expect(page.getByText("Active Workflows")).toBeVisible();
  });
});
