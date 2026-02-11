import { test, expect } from "./fixtures/auth";

test.describe("Dashboard", () => {
  test("displays page heading and description", async ({ authedPage: page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Overview of your firm")).toBeVisible();
  });

  test("shows all 6 metric cards", async ({ authedPage: page }) => {
    const metricNames = [
      "Active Clients",
      "Documents",
      "Hours This Week",
      "Outstanding Invoices",
      "Outstanding Amount",
      "Revenue MTD",
    ];
    for (const name of metricNames) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });

  test("shows quick action buttons", async ({ authedPage: page }) => {
    await expect(page.getByRole("link", { name: /New Client/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Log Time/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create Invoice/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Upload Document/ })).toBeVisible();
  });

  test("quick action navigates to clients page", async ({ authedPage: page }) => {
    await page.getByRole("link", { name: /New Client/ }).click();
    await expect(page).toHaveURL(/\/clients/);
  });

  test("quick action navigates to time page", async ({ authedPage: page }) => {
    await page.getByRole("link", { name: /Log Time/ }).click();
    await expect(page).toHaveURL(/\/time/);
  });

  test("quick action navigates to invoices page", async ({ authedPage: page }) => {
    await page.getByRole("link", { name: /Create Invoice/ }).click();
    await expect(page).toHaveURL(/\/invoices/);
  });

  test("quick action navigates to documents page", async ({ authedPage: page }) => {
    await page.getByRole("link", { name: /Upload Document/ }).click();
    await expect(page).toHaveURL(/\/documents/);
  });

  test("shows Revenue Trend chart card", async ({ authedPage: page }) => {
    await expect(page.getByText("Revenue Trend")).toBeVisible();
  });

  test("shows Team Utilization chart card", async ({ authedPage: page }) => {
    await expect(page.getByText("Team Utilization")).toBeVisible();
  });

  test("shows Upcoming Deadlines section", async ({ authedPage: page }) => {
    await expect(page.getByText("Upcoming Deadlines")).toBeVisible();
  });

  test("shows Pending Tasks section", async ({ authedPage: page }) => {
    await expect(page.getByText("Pending Tasks")).toBeVisible();
  });
});
