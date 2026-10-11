const test = require("node:test");
const assert = require("node:assert");
require("./helpers");
const { clean } = require("../src/middleware/security");

test("clean removes $operators and dotted keys at any depth", () => {
  assert.deepStrictEqual(clean({ email: { $gt: "" }, name: "ok" }), { email: {}, name: "ok" });
  assert.deepStrictEqual(clean({ a: [{ $where: "x", b: 1 }] }), { a: [{ b: 1 }] });
  assert.deepStrictEqual(clean({ "a.b": 1, c: 2 }), { c: 2 });
});

test("clean leaves normal values and file buffers alone", () => {
  const buf = Buffer.from("%PDF");
  assert.strictEqual(clean(buf), buf);
  assert.strictEqual(clean("text"), "text");
  assert.strictEqual(clean(5), 5);
  assert.strictEqual(clean(null), null);
});
