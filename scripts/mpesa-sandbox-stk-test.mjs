#!/usr/bin/env node

/**
 * Sandbox-only M-Pesa STK smoke test.
 *
 * This calls the deployed application endpoint, not the provider directly, so
 * it exercises order lookup, STK attempt creation, Daraja sandbox initiation,
 * and the application's status reader. It never prints credentials.
 *
 * Required environment:
 *   ALLOW_LIVE_STK_TEST=true
 *   MPESA_ENVIRONMENT=sandbox
 *   MPESA_TEST_BASE_URL=https://dailygear.co.ke
 *   MPESA_TEST_ORDER_NUMBER=existing-order-number
 *   MPESA_TEST_PHONE=registered-sandbox-msisdn
 *
 * Optional:
 *   MPESA_TEST_POLL_SECONDS=90
 */

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const allow = required("ALLOW_LIVE_STK_TEST");
const environment = required("MPESA_ENVIRONMENT").toLowerCase();
if (allow !== "true") {
  throw new Error("Refusing live STK request: set ALLOW_LIVE_STK_TEST=true explicitly.");
}
if (environment !== "sandbox") {
  throw new Error("Refusing live STK request: MPESA_ENVIRONMENT must be exactly sandbox.");
}

const baseUrl = required("MPESA_TEST_BASE_URL").replace(/\/$/, "");
const orderNumber = required("MPESA_TEST_ORDER_NUMBER");
const phone = required("MPESA_TEST_PHONE");
const pollSeconds = Math.min(180, Math.max(15, Number(process.env.MPESA_TEST_POLL_SECONDS ?? 90)));

if (!/^https:\/\//i.test(baseUrl)) throw new Error("MPESA_TEST_BASE_URL must use HTTPS.");
if (!/^2547\d{8}$/.test(phone)) {
  throw new Error("MPESA_TEST_PHONE must be a normalized Kenyan MSISDN such as 2547XXXXXXXX.");
}

const requestJson = async (url, options) => {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error(`Application request failed (${response.status}): ${String(body.error ?? "unknown error")}`);
  }
  return body;
};

console.log(`Starting sandbox STK smoke test for order ${orderNumber}.`);
console.log("Credentials are held by the deployed server and are not printed.");

const initiated = await requestJson(`${baseUrl}/api/mpesa/stk-push`, {
  method: "POST",
  body: JSON.stringify({ orderNumber, phone }),
});

if (!initiated.checkoutRequestId) throw new Error("The application did not return a checkout request ID.");
console.log(`STK request accepted by the application (attempt ${initiated.attemptId ?? "created"}).`);
console.log(`Customer message: ${initiated.customerMessage ?? "not supplied"}`);
console.log(`Polling status for up to ${pollSeconds} seconds...`);

const deadline = Date.now() + pollSeconds * 1000;
let lastStatus = null;
while (Date.now() < deadline) {
  const query = new URLSearchParams({ checkoutRequestId: initiated.checkoutRequestId });
  const status = await requestJson(`${baseUrl}/api/mpesa/status?${query}`, { method: "GET" });
  const snapshot = `${status.status}:${status.resultDesc ?? ""}`;
  if (snapshot !== lastStatus) {
    console.log(`Status: ${status.status}${status.resultDesc ? ` — ${status.resultDesc}` : ""}`);
    lastStatus = snapshot;
  }
  if (["success", "failed", "cancelled", "timeout"].includes(status.status)) {
    if (status.status === "success") {
      console.log(`Sandbox settlement callback received; receipt=${status.receipt ?? "not returned"}.`);
    } else {
      console.log(`Sandbox STK reached terminal status: ${status.status}.`);
    }
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

console.log("No terminal callback arrived within the polling window; inspect the attempt by checkout request ID.");
process.exit(2);
