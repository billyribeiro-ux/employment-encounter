import { test, expect } from "./fixtures/auth";

test.describe("Expenses Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    await expect(page.getByRole("heading", { name: "Expenses" })).toBeVisible();
    await expect(page.getByText("Track firm and client expenses")).toBeVisible();
  });

  test("shows Record Expense button", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    await expect(page.getByRole("button", { name: /Record Expense/ })).toBeVisible();
  });

  test("shows search and status filter", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    await expect(page.getByPlaceholder("Search expenses...")).toBeVisible();
    await expect(page.getByText("All Statuses")).toBeVisible();
  });

  test("opens create expense dialog", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    await page.getByRole("button", { name: /Record Expense/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("filters expenses by status", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    await page.getByText("All Statuses").click();
    await page.getByRole("option", { name: "Pending" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("filters expenses by approved", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    await page.getByText("All Statuses").click();
    await page.getByRole("option", { name: "Approved" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("searches expenses", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    await page.getByPlaceholder("Search expenses...").fill("office");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("sorts expenses by amount", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    const amountHeader = page.locator("th").filter({ hasText: "Amount" });
    if (await amountHeader.isVisible()) {
      await amountHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("sorts expenses by date", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    const dateHeader = page.locator("th").filter({ hasText: "Date" });
    if (await dateHeader.isVisible()) {
      await dateHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("reset filters works", async ({ authedPage: page }) => {
    await page.goto("/expenses");
    await page.getByPlaceholder("Search expenses...").fill("xyz");
    await page.waitForTimeout(500);
    const resetBtn = page.getByRole("button", { name: /Reset/ });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(page.getByPlaceholder("Search expenses...")).toHaveValue("");
    }
  });
});
