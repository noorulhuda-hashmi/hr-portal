const test = require("node:test");
const assert = require("node:assert");
const { start, users, OID } = require("./helpers");
const Employee = require("../src/models/Employee");
const EmployeeDocument = require("../src/models/EmployeeDocument");

// Database ki jagah nakli jawab
Employee.exists = async () => true;
Employee.findById = () => ({ select: () => ({ catch: async () => ({ employeeId: "EMP-1", firstName: "A", lastName: "B" }) }) });
let existing = 0;
let saved;
EmployeeDocument.countDocuments = async () => existing;
EmployeeDocument.create = async (d) => {
  const doc = new EmployeeDocument(d);
  await doc.validate();
  saved = doc;
  return doc;
};
require("../src/models/ActivityLog").create = async () => {};
require("../src/models/Notification").insertMany = async () => {};
require("../src/models/User").find = () => ({ select: async () => [] });

let api;
test.before(async () => {
  api = await start();
});
test.after(() => api.close());

const url = `/api/employees/${OID}/documents`;
const pdf = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(100, 65)]);
const upload = (query, type, raw, user = users.hr, path = url) =>
  api.call("POST", `${path}?${query}`, { user, type, raw });

test("a real PDF is accepted and its name is cleaned", async () => {
  const r = await upload("category=cnic&name=" + encodeURIComponent('../../etc/pa"ss.pdf'), "application/pdf", pdf);
  assert.strictEqual(r.status, 201);
  assert.strictEqual(saved.originalName, ".._.._etc_pa_ss.pdf");
  assert.strictEqual(saved.size, pdf.length);
});

test("PNG and JPEG are accepted by their first bytes", async () => {
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(50)]);
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(50)]);
  assert.strictEqual((await upload("category=other&name=a.png", "image/png", png)).status, 201);
  assert.strictEqual((await upload("category=resume&name=a.jpg", "image/jpeg", jpg)).status, 201);
});

test("wrong or disguised files are refused", async () => {
  assert.match((await upload("category=other&name=x.html", "text/html", Buffer.from("<script>1</script>"))).json.message, /Only PDF, PNG or JPG/);
  assert.match((await upload("category=other&name=x.pdf", "application/pdf", Buffer.from("MZ not a pdf"))).json.message, /does not match/);
  assert.match((await upload("category=secret&name=a.pdf", "application/pdf", pdf)).json.message, /Document type must be/);
});

test("empty body, oversize file and the 11th file are refused", async () => {
  assert.strictEqual((await upload("category=cnic&name=a.pdf", "application/pdf", undefined)).status, 400);
  const big = Buffer.concat([Buffer.from("%PDF"), Buffer.alloc(3 * 1024 * 1024)]);
  const r = await upload("category=cnic&name=a.pdf", "application/pdf", big);
  assert.strictEqual(r.status, 413);
  assert.match(r.json.message, /2 MB/);
  existing = 10;
  assert.match((await upload("category=cnic&name=a.pdf", "application/pdf", pdf)).json.message, /Maximum 10/);
  existing = 0;
});

test("an employee uploads only to their own record", async () => {
  assert.strictEqual((await upload("category=cnic&name=a.pdf", "application/pdf", pdf, users.employee)).status, 403); // HR route
  const own = await upload("category=cnic&name=a.pdf", "application/pdf", pdf, users.employee, "/api/me/documents");
  assert.strictEqual(own.status, 201);
  assert.strictEqual(String(saved.employee), OID);
  assert.strictEqual(saved.uploadedByRole, "employee");
});
