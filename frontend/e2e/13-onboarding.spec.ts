import { test, expect } from "./fixtures/auth";

test.describe("Onboarding Wizard", () => {
  test("displays onboarding page heading", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
    await expect(page.getByText("Welcome to CPA Platform")).toBeVisible();
    await expect(page.getByText("Step 1: Firm Profile")).toBeVisible();
  });

  test("shows all 7 step indicators in progress bar", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
    const main = page.locator("main");
    const steps = [
      "Firm Profile",
      "Team Members",
      "Client Import",
      "Billing Setup",
      "Integrations",
      "Preferences",
      "Launch",
    ];
    for (const step of steps) {
      await expect(main.getByText(step).first()).toBeVisible();
    }
  });

  test("navigates through all steps with Continue button", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
    // Steps 1-6 use "Continue" button
    for (let i = 1; i <= 6; i++) {
      await expect(page.getByText(`Step ${i}:`)).toBeVisible();
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForTimeout(300);
    }
    // Step 7 — should show "You're all set!"
    await expect(page.getByText("You're all set!")).toBeVisible();
  });

  test("navigates back with Back button", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
    // Go to step 2
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText("Step 2:")).toBeVisible();
    // Go back to step 1
    await page.getByRole("button", { name: "Back" }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText("Step 1:")).toBeVisible();
  });

  test("completes onboarding and redirects to dashboard", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
    // Use Skip Setup to jump to step 7
    await page.getByRole("button", { name: "Skip Setup" }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText("You're all set!")).toBeVisible();
    // Click Go to Dashboard
    await page.getByRole("button", { name: "Go to Dashboard" }).click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  });
});
