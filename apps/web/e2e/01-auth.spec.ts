import { test, expect } from "@playwright/test";
import { loginViaUI } from "./fixtures/auth";

test.describe("Authentication", () => {
  test("register page renders correctly (employer flow)", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /I.m an Employer/i }).click();
    await expect(page.getByText("Create your employer account")).toBeVisible();
    await expect(page.getByLabel("Company Name")).toBeVisible();
    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create employer account" })
    ).toBeVisible();
  });

  test("register validates required fields", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("register validates password length", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /I.m an Employer/i }).click();
    await page.getByLabel("Company Name").fill("Test Firm");
    await page.getByLabel("First Name").fill("John");
    await page.getByLabel("Last Name").fill("Doe");
    await page.getByLabel("Email").fill("test@test.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page
      .getByRole("button", { name: "Create employer account" })
      .click();
    await expect(page.getByText("at least 12 characters")).toBeVisible();
  });

  test("login via UI lands on dashboard (proves global-setup registered user)", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: /Welcome back/i })
    ).toBeVisible();
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Sign in").first()).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    // Exact match because the "Show password" toggle button also has
    // an aria-label containing "Password".
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("login with valid credentials", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@wrong.com");
    await page.getByLabel("Password", { exact: true }).fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("navigate between login and register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL(/\/register/);
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
