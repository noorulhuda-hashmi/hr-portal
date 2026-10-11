const test = require("node:test");
const assert = require("node:assert");
const { start, users, OID } = require("./helpers");

let api;
test.before(async () => {
  api = await start();
});
test.after(() => api.close());

const HR_ONLY = [
  ["GET", "/api/employees"],
  ["POST", "/api/employees"],
  ["GET", `/api/employees/${OID}/documents`],
  ["GET", "/api/dashboard/stats"],
  ["GET", "/api/attendance"],
  ["POST", "/api/attendance"],
  ["GET", "/api/leaves"],
  ["POST", "/api/leaves"],
  ["PATCH", `/api/leaves/${OID}/review`],
  ["GET", "/api/payroll"],
  ["POST", "/api/payroll/generate"],
  ["POST", `/api/payroll/${OID}/pay`],
  ["GET", "/api/reports/attendance"],
  ["GET", `/api/documents/${OID}/download`],
];

test("every protected route answers 401 without a login", async () => {
  for (const [m, u] of [...HR_ONLY, ["GET", "/api/me/profile"], ["GET", "/api/notifications"], ["GET", "/api/holidays"], ["GET", "/api/activity"]]) {
    const r = await api.call(m, u);
    assert.strictEqual(r.status, 401, `${m} ${u}`);
  }
});

test("an employee is refused (403) on every HR-only route", async () => {
  for (const [m, u] of HR_ONLY) {
    const r = await api.call(m, u, { user: users.employee });
    assert.strictEqual(r.status, 403, `${m} ${u}`);
  }
});

test("activity log is admin only", async () => {
  assert.strictEqual((await api.call("GET", "/api/activity", { user: users.hr })).status, 403);
  assert.strictEqual((await api.call("GET", "/api/activity", { user: users.employee })).status, 403);
});

test("HR cannot use employee-only /me routes without a linked employee", async () => {
  for (const u of ["/api/me/dashboard", "/api/me/leaves", "/api/me/payslips", "/api/me/documents"]) {
    const r = await api.call("GET", u, { user: users.hr });
    assert.strictEqual(r.status, 403, u);
  }
  assert.match((await api.call("POST", "/api/me/checkin", { user: users.unlinked })).json.message, /not linked/);
});

test("register is admin only (no more public admin sign-up)", async () => {
  const body = { name: "X", email: "x@example.com", password: "secret123", role: "admin" };
  assert.strictEqual((await api.call("POST", "/api/auth/register", { body })).status, 401);
  assert.strictEqual((await api.call("POST", "/api/auth/register", { user: users.employee, body })).status, 403);
  assert.strictEqual((await api.call("POST", "/api/auth/register", { user: users.hr, body })).status, 403);
  // admin ke liye role ki jaanch chalti hai
  const bad = await api.call("POST", "/api/auth/register", { user: users.admin, body: { ...body, role: "superuser" } });
  assert.strictEqual(bad.status, 400);
});

test("login refuses non-text input (NoSQL injection attempt)", async () => {
  const r = await api.call("POST", "/api/auth/login", { body: { email: { $gt: "" }, password: { $gt: "" } } });
  assert.strictEqual(r.status, 400);
  const r2 = await api.call("POST", "/api/auth/login", { body: {} });
  assert.strictEqual(r2.status, 400);
});

test("password change checks", async () => {
  const u = users.hr;
  assert.strictEqual((await api.call("PUT", "/api/auth/password", { user: u, body: {} })).status, 400);
  assert.strictEqual((await api.call("PUT", "/api/auth/password", { user: u, body: { currentPassword: "a", newPassword: "abc" } })).status, 400);
  assert.strictEqual((await api.call("PUT", "/api/auth/password", { user: u, body: { currentPassword: "abcdef", newPassword: "abcdef" } })).status, 400);
});

test("month and date inputs are validated", async () => {
  assert.strictEqual((await api.call("GET", "/api/payroll?month=abc", { user: users.hr })).status, 400);
  assert.strictEqual((await api.call("GET", "/api/reports/attendance?month=2026-13", { user: users.hr })).status, 400);
  assert.strictEqual((await api.call("POST", "/api/payroll/generate", { user: users.hr, body: { month: "2030-01" } })).json.message, "Payroll cannot be generated for a future month");
  assert.strictEqual((await api.call("GET", "/api/attendance?date=11-10-2026", { user: users.hr })).status, 400);
});

test("unknown API route gives 404 and security headers are present", async () => {
  const r = await api.call("GET", "/api/nope");
  assert.strictEqual(r.status, 404);
  assert.strictEqual(r.headers.get("x-content-type-options"), "nosniff");
  assert.ok(!r.headers.get("x-powered-by"));
});

test("health check reports 503 when the database is not connected", async () => {
  const r = await api.call("GET", "/api/health");
  assert.strictEqual(r.status, 503);
  assert.strictEqual(r.json.db, "disconnected");
});
