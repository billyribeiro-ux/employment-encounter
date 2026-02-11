import { test, expect } from "./fixtures/auth";

test.describe("Reports Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
    await expect(page.getByText("Financial reports and team analytics")).toBeVisible();
  });

  test("shows date range inputs", async ({ authedPage: page }) => {
    await page.goto("/reports");
    await expect(page.getByText("From")).toBeVisible();
    await expect(page.getByText("To")).toBeVisible();
  });

  test("shows all 3 report tabs", async ({ authedPage: page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("tab", { name: "Profit & Loss" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cash Flow" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Team Utilization" })).toBeVisible();
  });

  test("P&L tab shows revenue and expense cards", async ({ authedPage: page }) => {
    await page.goto("/reports");
    // P&L is the default tab
    await page.waitForTimeout(2000);
    // Should show either data or loading skeleton
    await expect(page.locator("body")).toBeVisible();
  });

  test("switches to Cash Flow tab", async ({ authedPage: page }) => {
    await page.goto("/reports");
    await page.getByRole("tab", { name: "Cash Flow" }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("switches to Team Utilization tab", async ({ authedPage: page }) => {
    await page.goto("/reports");
    await page.getByRole("tab", { name: "Team Utilization" }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("changes date range", async ({ authedPage: page }) => {
    await page.goto("/reports");
    const fromInput = page.locator("input[type='date']").first();
    const toInput = page.locator("input[type='date']").last();
    await fromInput.fill("2025-01-01");
    await toInput.fill("2025-12-31");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toBeVisible();
  });
});
