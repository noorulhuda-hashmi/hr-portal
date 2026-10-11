const test = require("node:test");
const assert = require("node:assert");
require("./helpers");
const Leave = require("../src/models/Leave");
const Attendance = require("../src/models/Attendance");
const Payslip = require("../src/models/Payslip");
const Holiday = require("../src/models/Holiday");
const Employee = require("../src/models/Employee");
const EmployeeDocument = require("../src/models/EmployeeDocument");

const OID = "507f1f77bcf86cd799439011";

// Validation chala kar saare error messages ek list mein
const errors = async (doc) => {
  try {
    await doc.validate();
    return [];
  } catch (e) {
    return Object.values(e.errors).map((x) => x.message);
  }
};

test("Leave: valid request and day count", async () => {
  const l = new Leave({ employee: OID, leaveType: "sick", startDate: "2026-10-20", endDate: "2026-10-22", reason: "Fever and rest" });
  assert.deepStrictEqual(await errors(l), []);
  assert.strictEqual(l.days, 3);
  assert.strictEqual(l.status, "pending");
});

test("Leave: rejects bad dates, long ranges, short reason, bad type", async () => {
  const base = { employee: OID, leaveType: "sick", startDate: "2026-10-20", endDate: "2026-10-22", reason: "Fever and rest" };
  assert.match((await errors(new Leave({ ...base, endDate: "2026-10-19" })))[0], /before start/);
  assert.match((await errors(new Leave({ ...base, startDate: "2026-02-30" })))[0], /valid calendar date/);
  assert.match((await errors(new Leave({ ...base, endDate: "2026-11-25" })))[0], /30 days/);
  assert.match((await errors(new Leave({ ...base, reason: "ab" })))[0], /at least 5/);
  assert.match((await errors(new Leave({ ...base, leaveType: "holiday" })))[0], /annual, sick, casual or unpaid/);
  assert.ok((await errors(new Leave({ ...base, reason: "" }))).some((m) => /required/.test(m)));
});

test("Attendance: status is derived from check-in time", async () => {
  const early = new Attendance({ employee: OID, date: "2026-10-01", checkIn: "09:00" });
  await early.validate();
  assert.strictEqual(early.status, "present");
  const late = new Attendance({ employee: OID, date: "2026-10-01", checkIn: "10:13" });
  await late.validate();
  assert.strictEqual(late.status, "late");
  const none = new Attendance({ employee: OID, date: "2026-10-01" });
  await none.validate();
  assert.strictEqual(none.status, "absent");
});

test("Attendance: cross-field rules and date rules", async () => {
  const d = { employee: OID, date: "2026-10-01" };
  assert.deepStrictEqual(await errors(new Attendance({ ...d, checkOut: "17:00" })), ["Check-out needs a check-in time"]);
  assert.deepStrictEqual(await errors(new Attendance({ ...d, checkIn: "10:00", checkOut: "09:00" })), ["Check-out must be after check-in"]);
  assert.match((await errors(new Attendance({ ...d, checkIn: "10:00", status: "absent" })))[0], /absent record cannot have/);
  assert.match((await errors(new Attendance({ ...d, date: "2099-01-01" })))[0], /future/);
  assert.match((await errors(new Attendance({ ...d, date: "2026-02-30" })))[0], /valid calendar date/);
  assert.match((await errors(new Attendance({ ...d, checkIn: "25:00" })))[0], /time like/);
});

test("Payslip: net is calculated by the model and cannot go negative", async () => {
  const p = new Payslip({ employee: OID, month: "2026-10", basicSalary: 60000, bonus: 5000, absentDays: 3 });
  assert.deepStrictEqual(await errors(p), []);
  assert.strictEqual(p.netSalary, 59000);
  assert.match((await errors(new Payslip({ employee: OID, month: "2026-10", basicSalary: 60000, otherDeductions: 70000 })))[0], /more than total earnings/);
  assert.match((await errors(new Payslip({ employee: OID, month: "2026-13", basicSalary: 1 })))[0], /YYYY-MM/);
  assert.match((await errors(new Payslip({ employee: OID, month: "2026-10", basicSalary: 1, bonus: -1 })))[0], /negative/);
  assert.match((await errors(new Payslip({ employee: OID, month: "2026-10" })))[0], /Basic salary is required/);
});

test("Holiday: name and real date", async () => {
  assert.deepStrictEqual(await errors(new Holiday({ name: "Eid ul Fitr", date: "2027-03-20" })), []);
  assert.match((await errors(new Holiday({ name: "Test day", date: "2026-02-30" })))[0], /valid calendar date/);
  assert.match((await errors(new Holiday({ name: "x", date: "2026-12-25" })))[0], /at least 2/);
});

test("Employee: email, phone, salary rules", async () => {
  const ok = { employeeId: "EMP-0001", firstName: "Noor", lastName: "Huda", email: "noor@example.com" };
  assert.deepStrictEqual(await errors(new Employee(ok)), []);
  assert.match((await errors(new Employee({ ...ok, email: "not-an-email" })))[0], /valid email/);
  assert.match((await errors(new Employee({ ...ok, phone: "12" })))[0], /Phone must be/);
  assert.match((await errors(new Employee({ ...ok, salary: -5 })))[0], /negative/);
  assert.match((await errors(new Employee({ ...ok, firstName: "N" })))[0], /at least 2/);
});

test("EmployeeDocument: only known type and category", async () => {
  const d = { employee: OID, category: "cnic", originalName: "a.pdf", mimeType: "application/pdf", size: 10, data: Buffer.from("x"), uploadedBy: OID, uploadedByName: "A", uploadedByRole: "hr" };
  assert.deepStrictEqual(await errors(new EmployeeDocument(d)), []);
  assert.ok((await errors(new EmployeeDocument({ ...d, mimeType: "text/html" }))).length > 0);
  assert.match((await errors(new EmployeeDocument({ ...d, category: "secret" })))[0], /Document type must be/);
});
