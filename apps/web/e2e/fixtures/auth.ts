import { test as base, expect, Page } from "@playwright/test";

/**
 * Stable test user — always the same so the global-setup can register once
 * and every subsequent test can log in with these creds.
 */
export const TEST_USER = {
  firm_name: "E2E Playwright Firm",
  first_name: "Test",
  last_name: "User",
  email: "e2e-playwright@testfirm.com",
  password: "SecurePassword123!",
};

/**
 * Register via the UI. Called from global-setup.ts only.
 */
export async function registerViaUI(page: Page) {
  await page.goto("/register");
  // The register page defaults to the candidate flow; click the employer
  // toggle to surface the Company Name field.
  await page.getByRole("button", { name: /I.m an Employer/i }).click();
  await page.getByLabel("Company Name").fill(TEST_USER.firm_name);
  await page.getByLabel("First Name").fill(TEST_USER.first_name);
  await page.getByLabel("Last Name").fill(TEST_USER.last_name);
  await page.getByLabel("Email").fill(TEST_USER.email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_USER.password);
  await page
    .getByRole("button", { name: "Create employer account" })
    .click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

/**
 * Login via the UI.
 */
export async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_USER.email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_USER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

/**
 * Login via API and inject tokens into localStorage — fast auth for every test.
 */
export async function loginViaAPI(page: Page) {
  const res = await page.request.post("http://localhost:8080/api/v1/auth/login", {
    // Bearer header bypasses CSRF; value is irrelevant for the public
    // /auth/login route. Without it the request would be rejected as a
    // cookie-auth CSRF attempt.
    headers: { Authorization: "Bearer e2e-setup" },
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  if (!res.ok()) {
    throw new Error(`API login failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  await page.goto("/login");
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
 * Extended test fixture: provides `authedPage` — a page already logged in.
 */
 
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {  
    await loginViaAPI(page);
    await page.goto("/dashboard");
    await page.waitForURL("**/dashboard");
    await use(page); // eslint-disable-line
  },
});

export { expect };
