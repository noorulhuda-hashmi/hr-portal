const test = require("node:test");
const assert = require("node:assert");
require("./helpers");
const { isRealDate, isMonth, monthRange, overlapDays, localDateString, localTimeString } = require("../src/utils/date");
const { computeNet } = require("../src/utils/payroll");

test("isRealDate accepts real dates and rejects impossible ones", () => {
  assert.ok(isRealDate("2026-10-11"));
  assert.ok(isRealDate("2028-02-29")); // leap year
  assert.ok(!isRealDate("2026-02-29"));
  assert.ok(!isRealDate("2026-02-30"));
  assert.ok(!isRealDate("2026-13-01"));
  assert.ok(!isRealDate("11/10/2026"));
  assert.ok(!isRealDate(""));
});

test("isMonth and monthRange", () => {
  assert.ok(isMonth("2026-10"));
  assert.ok(!isMonth("2026-13"));
  assert.ok(!isMonth("abc"));
  assert.deepStrictEqual(monthRange("2026-02"), { from: "2026-02-01", to: "2026-02-28" });
  assert.deepStrictEqual(monthRange("2028-02"), { from: "2028-02-01", to: "2028-02-29" });
  assert.deepStrictEqual(monthRange("2026-10"), { from: "2026-10-01", to: "2026-10-31" });
});

test("overlapDays counts shared days only", () => {
  assert.strictEqual(overlapDays("2026-09-28", "2026-10-03", "2026-10-01", "2026-10-31"), 3);
  assert.strictEqual(overlapDays("2026-11-01", "2026-11-02", "2026-10-01", "2026-10-31"), 0);
  assert.strictEqual(overlapDays("2026-10-05", "2026-10-05", "2026-10-01", "2026-10-31"), 1);
});

test("local date and time formats", () => {
  assert.match(localDateString(), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(localTimeString(), /^([01]\d|2[0-3]):[0-5]\d$/);
  assert.strictEqual(localDateString(new Date(2026, 0, 5)), "2026-01-05");
  assert.strictEqual(localTimeString(new Date(2026, 0, 5, 9, 7)), "09:07");
});

test("computeNet: normal month with deductions", () => {
  const r = computeNet({ basicSalary: 60000, allowances: 5000, bonus: 2000, otherDeductions: 1000, absentDays: 2, unpaidLeaveDays: 1 });
  assert.strictEqual(r.gross, 67000);
  assert.strictEqual(r.absentDeduction, 4000);
  assert.strictEqual(r.unpaidLeaveDeduction, 2000);
  assert.strictEqual(r.net, 60000);
});

test("computeNet: automatic deductions never push salary below zero", () => {
  const r = computeNet({ basicSalary: 30000, absentDays: 31 });
  assert.strictEqual(r.net, 0);
});

test("computeNet: no deductions", () => {
  assert.strictEqual(computeNet({ basicSalary: 45000 }).net, 45000);
});
