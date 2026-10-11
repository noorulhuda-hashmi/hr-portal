const test = require("node:test");
const assert = require("node:assert");
require("./helpers");
const Leave = require("../src/models/Leave");
const { getBalance, assertWithinBalance, ALLOWANCE } = require("../src/utils/leaveBalance");

const leaves = [
  { leaveType: "annual", status: "approved", startDate: "2026-12-28", endDate: "2027-01-03" }, // saal ke aar-paar
  { leaveType: "annual", status: "pending", startDate: "2026-03-01", endDate: "2026-03-02" },
  { leaveType: "unpaid", status: "approved", startDate: "2026-05-01", endDate: "2026-05-01" },
];
Leave.find = async () => leaves;

const failure = async (fn) => {
  try {
    await fn();
    return null;
  } catch (e) {
    return e.message;
  }
};
const res = { status() {} };

test("allowances", () => {
  assert.deepStrictEqual(ALLOWANCE, { annual: 14, sick: 10, casual: 8, unpaid: null });
});

test("balance splits a leave that crosses the year end", async () => {
  const a2026 = (await getBalance("x", 2026)).balances.find((b) => b.type === "annual");
  assert.strictEqual(a2026.approved, 4); // 28-31 Dec
  assert.strictEqual(a2026.pending, 2);
  assert.strictEqual(a2026.remaining, 8);
  const a2027 = (await getBalance("x", 2027)).balances.find((b) => b.type === "annual");
  assert.strictEqual(a2027.approved, 3); // 1-3 Jan
  assert.strictEqual(a2027.remaining, 11);
});

test("unpaid leave has no limit", async () => {
  const unpaid = (await getBalance("x", 2026)).balances.find((b) => b.type === "unpaid");
  assert.strictEqual(unpaid.remaining, null);
  assert.strictEqual(await failure(() => assertWithinBalance(res, "x", "unpaid", "2026-06-01", "2026-08-30")), null);
});

test("a request within the balance passes, one above it fails", async () => {
  assert.strictEqual(await failure(() => assertWithinBalance(res, "x", "annual", "2026-06-01", "2026-06-04")), null);
  assert.match(await failure(() => assertWithinBalance(res, "x", "annual", "2026-06-01", "2026-06-10")), /8 day\(s\) left, 10 requested/);
  assert.match(await failure(() => assertWithinBalance(res, "x", "sick", "2026-06-01", "2026-06-11")), /10 day\(s\) left, 11 requested/);
});
