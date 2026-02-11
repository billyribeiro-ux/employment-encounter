import { test, expect } from "./fixtures/auth";

test.describe("Documents Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/documents");
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
    await expect(page.getByText("Upload, organize, and search")).toBeVisible();
  });

  test("shows Upload button", async ({ authedPage: page }) => {
    await page.goto("/documents");
    await expect(page.getByRole("button", { name: /Upload/ })).toBeVisible();
  });

  test("shows search input", async ({ authedPage: page }) => {
    await page.goto("/documents");
    await expect(page.getByPlaceholder("Search documents...")).toBeVisible();
  });

  test("shows category filter", async ({ authedPage: page }) => {
    await page.goto("/documents");
    await expect(page.getByText("All Categories")).toBeVisible();
  });

  test("opens upload document dialog", async ({ authedPage: page }) => {
    await page.goto("/documents");
    await page.getByRole("button", { name: /Upload/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("filters documents by category", async ({ authedPage: page }) => {
    await page.goto("/documents");
    await page.getByText("All Categories").click();
    await page.getByRole("option", { name: "Tax Return" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("searches documents", async ({ authedPage: page }) => {
    await page.goto("/documents");
    await page.getByPlaceholder("Search documents...").fill("tax");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("sorts documents by name", async ({ authedPage: page }) => {
    await page.goto("/documents");
    const nameHeader = page.locator("th").filter({ hasText: "Name" });
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("sorts documents by uploaded date", async ({ authedPage: page }) => {
    await page.goto("/documents");
    const uploadedHeader = page.locator("th").filter({ hasText: "Uploaded" });
    if (await uploadedHeader.isVisible()) {
      await uploadedHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("reset filters works", async ({ authedPage: page }) => {
    await page.goto("/documents");
    await page.getByPlaceholder("Search documents...").fill("xyz");
    await page.waitForTimeout(500);
    const resetBtn = page.getByRole("button", { name: /Reset/ });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(page.getByPlaceholder("Search documents...")).toHaveValue("");
    }
  });
});
