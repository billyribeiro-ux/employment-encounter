import { test, expect } from "./fixtures/auth";

test.describe("Settings Page", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Manage your account and firm")).toBeVisible();
  });

  test("shows all 6 settings tabs", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("tab", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Firm" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Team" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Integrations" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Billing" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Security" })).toBeVisible();
  });

  test("Profile tab shows form fields", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Phone")).toBeVisible();
    await expect(page.getByLabel("Job Title")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible();
  });

  test("Profile tab save shows toast", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible({ timeout: 5000 });
  });

  test("Firm tab shows firm settings", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await page.getByRole("tab", { name: "Firm" }).click();
    await expect(page.getByText("Firm Settings")).toBeVisible();
    await expect(page.getByLabel("Firm Name")).toBeVisible();
    await expect(page.getByLabel("Firm Email")).toBeVisible();
  });

  test("Firm tab save shows toast", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await page.getByRole("tab", { name: "Firm" }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Firm settings updated")).toBeVisible({ timeout: 5000 });
  });

  test("Team tab shows current user and invite button", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await page.getByRole("tab", { name: "Team" }).click();
    await expect(page.getByText("Team Members")).toBeVisible();
    await expect(page.getByRole("button", { name: /Invite Member/ })).toBeVisible();
  });

  test("Integrations tab shows all 3 integrations", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await page.getByRole("tab", { name: "Integrations" }).click();
    await expect(page.getByText("QuickBooks Online")).toBeVisible();
    await expect(page.getByText("Google Drive")).toBeVisible();
    await expect(page.getByText("Stripe")).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect QuickBooks" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect Google Drive" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect Stripe" })).toBeVisible();
  });

  test("Billing tab shows subscription info", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await page.getByRole("tab", { name: "Billing" }).click();
    await expect(page.getByText("Subscription")).toBeVisible();
    await expect(page.getByText("Current Plan")).toBeVisible();
    await expect(page.getByRole("button", { name: "Upgrade" })).toBeVisible();
  });

  test("Security tab shows password change and MFA", async ({ authedPage: page }) => {
    await page.goto("/settings");
    await page.getByRole("tab", { name: "Security" }).click();
    await expect(page.getByText("Change Password")).toBeVisible();
    await expect(page.getByLabel("Current Password")).toBeVisible();
    await expect(page.getByLabel("New Password")).toBeVisible();
    await expect(page.getByLabel("Confirm New Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Update Password" })).toBeVisible();
    await expect(page.getByText("Two-Factor Authentication")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enable MFA" })).toBeVisible();
  });
});
