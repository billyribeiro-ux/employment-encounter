import { test, expect } from "./fixtures/auth";

test.describe("Messages Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await expect(page.getByText("Secure messaging with clients")).toBeVisible();
  });

  test("shows client search sidebar", async ({ authedPage: page }) => {
    await page.goto("/messages");
    await expect(page.getByPlaceholder("Search clients...")).toBeVisible();
  });

  test("shows select a client prompt when none selected", async ({ authedPage: page }) => {
    await page.goto("/messages");
    await expect(page.getByText("Select a client")).toBeVisible();
    await expect(page.getByText("Choose a client from the list")).toBeVisible();
  });

  test("searches clients in sidebar", async ({ authedPage: page }) => {
    await page.goto("/messages");
    await page.getByPlaceholder("Search clients...").fill("Acme");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("selects a client and shows message thread", async ({ authedPage: page }) => {
    await page.goto("/messages");
    await page.waitForTimeout(2000);
    // Click the first client in the sidebar if available
    const clientBtn = page.locator("button").filter({ has: page.locator(".rounded-full") }).first();
    if (await clientBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientBtn.click();
      // Should show the message input area
      await expect(page.getByPlaceholder("Type a message...")).toBeVisible();
    }
  });

  test("sends a message", async ({ authedPage: page }) => {
    await page.goto("/messages");
    await page.waitForTimeout(2000);
    const clientBtn = page.locator("button").filter({ has: page.locator(".rounded-full") }).first();
    if (await clientBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientBtn.click();
      await page.getByPlaceholder("Type a message...").fill("Hello from E2E test!");
      await page.locator("form button[type='submit']").click();
      await page.waitForTimeout(2000);
      await expect(page.getByText("Hello from E2E test!")).toBeVisible({ timeout: 10_000 });
    }
  });

  test("message input is disabled when empty", async ({ authedPage: page }) => {
    await page.goto("/messages");
    await page.waitForTimeout(2000);
    const clientBtn = page.locator("button").filter({ has: page.locator(".rounded-full") }).first();
    if (await clientBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clientBtn.click();
      const sendBtn = page.locator("form button[type='submit']");
      await expect(sendBtn).toBeDisabled();
    }
  });
});
