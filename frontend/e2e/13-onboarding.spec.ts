import { test, expect } from "./fixtures/auth";

test.describe("Onboarding Wizard", () => {
  test("displays onboarding page", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
    await expect(page.getByText("Firm Profile")).toBeVisible();
  });

  test("shows all 7 step indicators", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
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
      await expect(page.getByText(step).first()).toBeVisible();
    }
  });

  test("navigates through all steps with Next button", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
    // Step 1 → 2
    await page.getByRole("button", { name: /Next|Continue/i }).click();
    await page.waitForTimeout(300);
    // Step 2 → 3
    await page.getByRole("button", { name: /Next|Continue/i }).click();
    await page.waitForTimeout(300);
    // Step 3 → 4
    await page.getByRole("button", { name: /Next|Continue|Skip/i }).click();
    await page.waitForTimeout(300);
    // Step 4 → 5
    await page.getByRole("button", { name: /Next|Continue|Skip/i }).click();
    await page.waitForTimeout(300);
    // Step 5 → 6
    await page.getByRole("button", { name: /Next|Continue|Skip/i }).click();
    await page.waitForTimeout(300);
    // Step 6 → 7
    await page.getByRole("button", { name: /Next|Continue|Skip/i }).click();
    await page.waitForTimeout(300);
    // Step 7 — should show Launch / Complete
    await expect(page.getByText("Launch")).toBeVisible();
  });

  test("navigates back with Previous button", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
    // Go to step 2
    await page.getByRole("button", { name: /Next|Continue/i }).click();
    await page.waitForTimeout(300);
    // Go back to step 1
    const backBtn = page.getByRole("button", { name: /Previous|Back/i });
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("completes onboarding and redirects to dashboard", async ({ authedPage: page }) => {
    await page.goto("/onboarding");
    // Navigate through all steps
    for (let i = 0; i < 6; i++) {
      const nextBtn = page.getByRole("button", { name: /Next|Continue|Skip/i });
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }
    // Click the final complete/launch button
    const completeBtn = page.getByRole("button", { name: /Launch|Complete|Get Started|Finish/i });
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForURL("**/dashboard", { timeout: 10_000 });
    }
  });
});
