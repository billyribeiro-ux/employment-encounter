import { test as base, expect, Page } from "@playwright/test";

// Unique test user credentials — timestamp ensures no collisions
const ts = Date.now();
export const TEST_USER = {
  firm_name: `E2E Test Firm ${ts}`,
  first_name: "Test",
  last_name: "User",
  email: `e2e-${ts}@testfirm.com`,
  password: "SecurePassword123!",
};

/**
 * Register a brand-new account via the UI.
 * After success the browser is on /dashboard with tokens in localStorage.
 */
export async function registerViaUI(page: Page) {
  await page.goto("/register");
  await page.getByLabel("Firm Name").fill(TEST_USER.firm_name);
  await page.getByLabel("First Name").fill(TEST_USER.first_name);
  await page.getByLabel("Last Name").fill(TEST_USER.last_name);
  await page.getByLabel("Email").fill(TEST_USER.email);
  await page.getByLabel("Password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

/**
 * Login with existing credentials via the UI.
 */
export async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_USER.email);
  await page.getByLabel("Password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

/**
 * Login via direct API call and inject tokens into localStorage.
 * Much faster than going through the UI for every test.
 */
export async function loginViaAPI(page: Page) {
  const res = await page.request.post("http://localhost:8080/api/v1/auth/login", {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  if (!res.ok()) {
    throw new Error(`API login failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  await page.goto("/login"); // need a page context to set localStorage
  await page.evaluate(
    ({ access_token, refresh_token, user }) => {
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("auth-storage", JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 }));
    },
    body
  );
}

/**
 * Extended test fixture that provides an authenticated page.
 * Usage: import { test } from "./fixtures/auth";
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await loginViaAPI(page);
    await page.goto("/dashboard");
    await page.waitForURL("**/dashboard");
    await use(page);
  },
});

export { expect };
