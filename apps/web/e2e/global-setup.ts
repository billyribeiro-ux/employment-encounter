import { TEST_USER } from "./fixtures/auth";

const API = "http://localhost:8080/api/v1";

// Bearer-auth requests are exempt from CSRF (browsers can't set the
// Authorization header on a cross-site cookie attack, so CSRF doesn't
// apply to that auth mode). Setup uses raw fetch without the axios
// interceptor, so signal Bearer-auth here. The token value is irrelevant
// — /auth/register and /auth/login are public routes with no auth check;
// the header just suppresses CSRF.
const SETUP_HEADERS = {
  "Content-Type": "application/json",
  Authorization: "Bearer e2e-setup",
};

/**
 * Runs once before all tests.
 * Registers the E2E test user via API (or confirms it already exists by logging in).
 */
async function globalSetup() {
  const regRes = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: SETUP_HEADERS,
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

  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: SETUP_HEADERS,
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
