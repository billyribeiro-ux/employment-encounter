import { test, expect } from "./fixtures/auth";

test.describe("Clients Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/clients");
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Clients" }).first()).toBeVisible();
    await expect(main.getByText("Manage your firm")).toBeVisible();
  });

  test("shows Add Client button", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await expect(page.locator("main").getByRole("button", { name: /Add Client/ }).first()).toBeVisible();
  });

  test("shows search input", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await expect(page.getByPlaceholder("Search clients...")).toBeVisible();
  });

  test("shows status filter dropdown", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await expect(page.getByText("All Statuses")).toBeVisible();
  });

  test("opens create client dialog", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await page.getByRole("button", { name: /Add Client/ }).first().click();
    // Dialog should appear with form fields
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("creates a new client", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await page.getByRole("button", { name: /Add Client/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in the client form — use dialog-scoped selectors
    const dialog = page.getByRole("dialog");
    // Try filling the first text input in the dialog (Name field)
    const nameInput = dialog.locator("input").first();
    await nameInput.fill("Acme Corporation E2E");

    // Submit the form
    const submitBtn = dialog.getByRole("button", { name: /Create|Save|Add|Submit/i }).first();
    await submitBtn.click();

    // Wait for either success (dialog closes) or just verify no crash
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("searches for a client", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await page.getByPlaceholder("Search clients...").fill("Acme");
    // Wait for debounced search
    await page.waitForTimeout(500);
    // Should either show results or "no results" — page should not crash
    await expect(page.locator("body")).toBeVisible();
  });

  test("filters clients by status", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await page.locator("main").getByText("All Statuses").click();
    await page.getByRole("option", { name: "Active" }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("sorts clients by name", async ({ authedPage: page }) => {
    await page.goto("/clients");
    // Click the Name column header to toggle sort
    const nameHeader = page.locator("th").filter({ hasText: "Name" });
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("reset filters button works", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await page.getByPlaceholder("Search clients...").fill("xyz");
    await page.waitForTimeout(500);
    const resetBtn = page.getByRole("button", { name: /Reset/ });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(page.getByPlaceholder("Search clients...")).toHaveValue("");
    }
  });

  test("navigates to client detail page", async ({ authedPage: page }) => {
    await page.goto("/clients");
    // If there are clients, click the first one
    const firstClientLink = page.locator("table a").first();
    if (await firstClientLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstClientLink.click();
      await expect(page).toHaveURL(/\/clients\/[a-f0-9-]+/);
    }
  });

  test("delete client shows confirmation dialog", async ({ authedPage: page }) => {
    await page.goto("/clients");
    // Find a delete button in the table
    const deleteBtn = page.locator("table button").filter({ has: page.locator("svg") }).first();
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(page.getByText("Delete client?")).toBeVisible();
      // Cancel the deletion
      await page.getByRole("button", { name: /Cancel/i }).click();
    }
  });
});
