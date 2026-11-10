#!/usr/bin/env node

/*
 * Safe rate-limit smoke test for the URL shortener backend.
 *
 * Usage:
 *   node test-rate-limit.cjs
 *   API_BASE_URL=http://localhost:5000 node test-rate-limit.cjs
 *   node test-rate-limit.cjs --general
 *
 * The default test sends 21 invalid login requests. The backend allows
 * 20 authentication requests per 15-minute window, so request 21 should
 * receive HTTP 429. No real account or password is used.
 */

const API_BASE_URL = (
  process.env.API_BASE_URL || "https://minilink-013c.onrender.com"
).replace(/\/+$/, "");

const AUTH_LIMIT = 20;
const GENERAL_LIMIT = 300;
const mode = process.argv.includes("--general") ? "general" : "auth";
const requestCount = Number(
  process.env.REQUEST_COUNT || (mode === "auth" ? AUTH_LIMIT + 1 : GENERAL_LIMIT + 1),
);

if (!Number.isInteger(requestCount) || requestCount < 1 || requestCount > 1000) {
  console.error("ERROR: REQUEST_COUNT must be an integer between 1 and 1000.");
  process.exit(1);
}

function printHeader(response, name) {
  const value = response.headers.get(name);
  return value === null ? "not returned" : value;
}

async function sendRequest(index) {
  const isAuthTest = mode === "auth";
  const endpoint = isAuthTest
    ? `${API_BASE_URL}/api/v1/auth/login`
    : `${API_BASE_URL}/api/v1/urls/mine`;

  const options = isAuthTest
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `rate-limit-test-${Date.now()}@example.invalid`,
          password: "DefinitelyNotARealPassword1",
        }),
      }
    : { method: "GET" };

  try {
    const response = await fetch(endpoint, options);
    const body = await response.text();
    const remaining = printHeader(response, "ratelimit-remaining");
    const reset = printHeader(response, "ratelimit-reset");

    console.log(
      `[${String(index).padStart(3, "0")}/${requestCount}] ` +
        `HTTP ${response.status} | remaining: ${remaining} | reset: ${reset}`,
    );

    if (response.status === 429) {
      console.log("\nSUCCESS: Rate limiting is working.");
      console.log("The backend rejected this request with HTTP 429.");
      console.log(`Response: ${body || "(empty response)"}`);
      return true;
    }

    if (isAuthTest && response.status !== 401) {
      console.log(`  Note: expected HTTP 401 before the limit, received ${response.status}.`);
    }

    if (!isAuthTest && response.status !== 401) {
      console.log(`  Note: expected HTTP 401 before the limit, received ${response.status}.`);
    }
  } catch (error) {
    console.error(`\nERROR: Could not reach ${endpoint}`);
    console.error(error.message);
    process.exitCode = 1;
    return true;
  }

  return false;
}

async function main() {
  const expectedLimit = mode === "auth" ? AUTH_LIMIT : GENERAL_LIMIT;
  const endpointLabel = mode === "auth"
    ? "POST /api/v1/auth/login"
    : "GET /api/v1/urls/mine";

  console.log("=".repeat(72));
  console.log("URL SHORTENER RATE-LIMIT TEST");
  console.log("=".repeat(72));
  console.log(`Backend: ${API_BASE_URL}`);
  console.log(`Endpoint: ${endpointLabel}`);
  console.log(`Configured limit: ${expectedLimit} requests per 15 minutes`);
  console.log(`Requests planned: ${requestCount}`);
  console.log("");
  console.log(
    mode === "auth"
      ? "The test uses invalid credentials, so HTTP 401 is expected before HTTP 429."
      : "The test does not send a token, so HTTP 401 is expected before HTTP 429.",
  );
  console.log("This uses the current machine's IP and may temporarily block it.");
  console.log("");

  for (let index = 1; index <= requestCount; index += 1) {
    const rateLimitReached = await sendRequest(index);
    if (rateLimitReached) return;
  }

  console.log("\nRESULT: No HTTP 429 was received.");
  console.log(
    "The limit may not have been reached, the deployed service may be running older code, or the rate-limit window may already be in progress.",
  );
  process.exitCode = 2;
}

main();
