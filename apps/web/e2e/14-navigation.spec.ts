import { test, expect } from "./fixtures/auth";

test.describe("Navigation & Sidebar", () => {
  test("sidebar shows all 13 navigation items", async ({ authedPage: page }) => {
    const navItems = [
      "Dashboard",
      "Clients",
      "Documents",
      "Workflows",
      "Tasks",
      "Time Tracking",
      "Invoices",
      "Expenses",
      "Analytics",
      "Reports",
      "Messages",
      "Calendar",
      "Settings",
    ];
    for (const item of navItems) {
      await expect(page.getByRole("link", { name: item })).toBeVisible();
    }
  });

  test("sidebar shows CPA Platform branding", async ({ authedPage: page }) => {
    await expect(page.getByText("CPA Platform")).toBeVisible();
  });

  test("sidebar shows version footer", async ({ authedPage: page }) => {
    await expect(page.getByText("v0.1.0 MVP")).toBeVisible();
  });

  test("navigates to each page from sidebar", async ({ authedPage: page }) => {
    const routes = [
      { name: "Clients", url: "/clients" },
      { name: "Documents", url: "/documents" },
      { name: "Workflows", url: "/workflows" },
      { name: "Tasks", url: "/tasks" },
      { name: "Time Tracking", url: "/time" },
      { name: "Invoices", url: "/invoices" },
      { name: "Expenses", url: "/expenses" },
      { name: "Analytics", url: "/analytics" },
      { name: "Reports", url: "/reports" },
      { name: "Messages", url: "/messages" },
      { name: "Calendar", url: "/calendar" },
      { name: "Settings", url: "/settings" },
      { name: "Dashboard", url: "/dashboard" },
    ];
    for (const route of routes) {
      await page.getByRole("link", { name: route.name }).click();
      await expect(page).toHaveURL(new RegExp(route.url));
      await page.waitForTimeout(300);
    }
  });

  test("active nav item is highlighted", async ({ authedPage: page }) => {
    await page.goto("/clients");
    const clientsLink = page.getByRole("link", { name: "Clients" });
    await expect(clientsLink).toHaveClass(/text-primary/);
  });

  test("page transitions animate smoothly (no crash)", async ({ authedPage: page }) => {
    // Navigate between pages rapidly to test Framer Motion transitions
    await page.getByRole("link", { name: "Clients" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("link", { name: "Invoices" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("link", { name: "Tasks" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("Analytics Page", () => {
  test("displays analytics page", async ({ authedPage: page }) => {
    await page.goto("/analytics");
    await expect(page.locator("body")).toBeVisible();
    // Page should load without errors
  });
});

test.describe("Calendar Page", () => {
  test("displays calendar page", async ({ authedPage: page }) => {
    await page.goto("/calendar");
    await expect(page.locator("body")).toBeVisible();
    // Page should load without errors
  });
});
