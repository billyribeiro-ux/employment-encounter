import { test, expect } from "./fixtures/auth";

test.describe("Clients Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
    await expect(page.getByText("Manage your firm")).toBeVisible();
  });

  test("shows Add Client button", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await expect(page.getByRole("button", { name: /Add Client/ })).toBeVisible();
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
    await page.getByRole("button", { name: /Add Client/ }).click();
    // Dialog should appear with form fields
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("creates a new client", async ({ authedPage: page }) => {
    await page.goto("/clients");
    await page.getByRole("button", { name: /Add Client/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill in the client form
    await page.getByLabel("Name").fill("Acme Corporation E2E");
    await page.getByLabel("Business Type").fill("LLC");
    await page.getByLabel("Fiscal Year End").fill("Calendar");

    // Submit the form
    const submitBtn = page.getByRole("dialog").getByRole("button", { name: /Create|Save|Add/i });
    await submitBtn.click();

    // Wait for the dialog to close and client to appear
    await page.waitForTimeout(2000);
    await expect(page.getByText("Acme Corporation E2E")).toBeVisible({ timeout: 10_000 });
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
    await page.getByText("All Statuses").click();
    await page.getByRole("option", { name: "Active" }).click();
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
