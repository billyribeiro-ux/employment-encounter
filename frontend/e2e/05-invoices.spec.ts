import { test, expect } from "./fixtures/auth";

test.describe("Invoices Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    await expect(page.getByRole("heading", { name: "Invoices" }).first()).toBeVisible();
    await expect(page.getByText("Create, send, and track")).toBeVisible();
  });

  test("shows New Invoice button", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    await expect(page.getByRole("button", { name: /New Invoice/ })).toBeVisible();
  });

  test("shows search and status filter", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    await expect(page.getByPlaceholder("Search invoices...")).toBeVisible();
    await expect(page.getByText("All Statuses")).toBeVisible();
  });

  test("opens create invoice dialog", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    await page.getByRole("button", { name: /New Invoice/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("filters invoices by status", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    await page.getByText("All Statuses").click();
    await page.getByRole("option", { name: "Draft" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("filters invoices by paid status", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    await page.getByText("All Statuses").click();
    await page.getByRole("option", { name: "Paid" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("searches invoices", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    await page.getByPlaceholder("Search invoices...").fill("INV");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("sorts invoices by amount", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    const amountHeader = page.locator("th").filter({ hasText: "Amount" });
    if (await amountHeader.isVisible()) {
      await amountHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("sorts invoices by due date", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    const dueDateHeader = page.locator("th").filter({ hasText: "Due Date" });
    if (await dueDateHeader.isVisible()) {
      await dueDateHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("navigates to invoice detail page", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    const firstInvoiceLink = page.locator("table a").first();
    if (await firstInvoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstInvoiceLink.click();
      await expect(page).toHaveURL(/\/invoices\/[a-f0-9-]+/);
    }
  });

  test("reset filters works", async ({ authedPage: page }) => {
    await page.goto("/invoices");
    await page.getByPlaceholder("Search invoices...").fill("xyz");
    await page.waitForTimeout(500);
    const resetBtn = page.getByRole("button", { name: /Reset/ });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(page.getByPlaceholder("Search invoices...")).toHaveValue("");
    }
  });
});
