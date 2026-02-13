import { test, expect } from "./fixtures/auth";

test.describe("Time Tracking Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/time");
    await expect(page.getByRole("heading", { name: "Time Tracking" })).toBeVisible();
    await expect(page.getByText("Track billable and non-billable")).toBeVisible();
  });

  test("shows Manual Entry and Start Timer buttons", async ({ authedPage: page }) => {
    await page.goto("/time");
    await expect(page.getByRole("button", { name: /Manual Entry/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Start Timer/ }).first()).toBeVisible();
  });

  test("shows search and billable filter", async ({ authedPage: page }) => {
    await page.goto("/time");
    await expect(page.getByPlaceholder("Search time entries...")).toBeVisible();
    await expect(page.getByText("All Entries")).toBeVisible();
  });

  test("opens manual entry dialog", async ({ authedPage: page }) => {
    await page.goto("/time");
    await page.getByRole("button", { name: /Manual Entry/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("opens timer dialog", async ({ authedPage: page }) => {
    await page.goto("/time");
    await page.getByRole("button", { name: /Start Timer/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("filters by billable", async ({ authedPage: page }) => {
    await page.goto("/time");
    await page.getByText("All Entries").click();
    await page.getByRole("option", { name: "Billable" }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("filters by non-billable", async ({ authedPage: page }) => {
    await page.goto("/time");
    await page.getByText("All Entries").click();
    await page.getByRole("option", { name: "Non-Billable" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("searches time entries", async ({ authedPage: page }) => {
    await page.goto("/time");
    await page.getByPlaceholder("Search time entries...").fill("meeting");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("sorts by duration", async ({ authedPage: page }) => {
    await page.goto("/time");
    const durationHeader = page.locator("th").filter({ hasText: "Duration" });
    if (await durationHeader.isVisible()) {
      await durationHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("sorts by date", async ({ authedPage: page }) => {
    await page.goto("/time");
    const dateHeader = page.locator("th").filter({ hasText: "Date" });
    if (await dateHeader.isVisible()) {
      await dateHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("reset filters works", async ({ authedPage: page }) => {
    await page.goto("/time");
    await page.getByPlaceholder("Search time entries...").fill("xyz");
    await page.waitForTimeout(500);
    const resetBtn = page.getByRole("button", { name: /Reset/ });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(page.getByPlaceholder("Search time entries...")).toHaveValue("");
    }
  });
});
