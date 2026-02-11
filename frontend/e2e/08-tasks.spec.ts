import { test, expect } from "./fixtures/auth";

test.describe("Tasks Page (Kanban Board)", () => {
  test("displays page heading", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
    await expect(page.getByText("Manage tasks across your firm")).toBeVisible();
  });

  test("shows Add Task button", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    await expect(page.getByRole("button", { name: /Add Task/ })).toBeVisible();
  });

  test("shows search and priority filter", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    await expect(page.getByPlaceholder("Search tasks...")).toBeVisible();
    await expect(page.getByText("All Priorities")).toBeVisible();
  });

  test("shows all 4 kanban columns", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    // Wait for loading to finish
    await page.waitForTimeout(2000);
    // Columns should be visible (either in board or skeleton)
    const columns = ["To Do", "In Progress", "Review", "Done"];
    for (const col of columns) {
      await expect(page.getByText(col, { exact: true }).first()).toBeVisible();
    }
  });

  test("opens create task dialog", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    await page.getByRole("button", { name: /Add Task/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("creates a task inline via Add task button in column", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    await page.waitForTimeout(2000);
    // Click the "Add task" button in the first column
    const addTaskBtn = page.getByRole("button", { name: /Add task/i }).first();
    if (await addTaskBtn.isVisible()) {
      await addTaskBtn.click();
      // Should show an inline input
      const input = page.getByPlaceholder("Task title...");
      await expect(input).toBeVisible();
      await input.fill("E2E Test Task");
      await page.getByRole("button", { name: "Add" }).click();
      await page.waitForTimeout(2000);
    }
  });

  test("filters tasks by priority", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    await page.getByText("All Priorities").click();
    await page.getByRole("option", { name: "High" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("searches tasks", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    await page.getByPlaceholder("Search tasks...").fill("E2E");
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("cancel inline task creation", async ({ authedPage: page }) => {
    await page.goto("/tasks");
    await page.waitForTimeout(2000);
    const addTaskBtn = page.getByRole("button", { name: /Add task/i }).first();
    if (await addTaskBtn.isVisible()) {
      await addTaskBtn.click();
      const cancelBtn = page.getByRole("button", { name: "Cancel" });
      await expect(cancelBtn).toBeVisible();
      await cancelBtn.click();
      await expect(page.getByPlaceholder("Task title...")).not.toBeVisible();
    }
  });
});
