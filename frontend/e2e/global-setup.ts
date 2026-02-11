import { TEST_USER } from "./fixtures/auth";

const API = "http://localhost:8080/api/v1";

/**
 * Runs once before all tests.
 * Registers the E2E test user via API (or confirms it already exists by logging in).
 */
async function globalSetup() {
  // 1. Try to register via API
  const regRes = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firm_name: TEST_USER.firm_name,
      first_name: TEST_USER.first_name,
      last_name: TEST_USER.last_name,
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
  });

  if (regRes.ok) {
    console.log("✅ Global setup: registered new E2E user");
    return;
  }

  // 2. Registration failed (probably already exists) — verify by logging in
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
  });

  if (loginRes.ok) {
    console.log("✅ Global setup: E2E user already exists, login OK");
    return;
  }

  throw new Error(
    `❌ Global setup failed: could not register (${regRes.status}) or login (${loginRes.status})`
  );
}

export default globalSetup;
