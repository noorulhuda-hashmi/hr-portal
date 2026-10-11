// Tests database ke bagair chalte hain: User ko nakli bana kar "kaun login hai" khud tay karte hain
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_at_least_16_chars";

const jwt = require("jsonwebtoken");
const User = require("../src/models/User");

const OID = "507f1f77bcf86cd799439011";
let currentUser = null;
User.findById = async () => currentUser;

const app = require("../src/server");
const token = jwt.sign({ id: OID }, process.env.JWT_SECRET);

// Server chalata hai aur request bhejne wala chhota function deta hai
const start = () =>
  new Promise((resolve) => {
    const server = app.listen(0, () => {
      const base = `http://localhost:${server.address().port}`;
      const call = async (method, url, { user, body, type = "application/json", raw } = {}) => {
        currentUser = user || null;
        const headers = {};
        if (user) headers.Authorization = `Bearer ${token}`;
        if (body !== undefined || raw !== undefined) headers["Content-Type"] = type;
        const res = await fetch(base + url, {
          method,
          headers,
          body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
        });
        const json = await res.json().catch(() => ({}));
        return { status: res.status, json, headers: res.headers };
      };
      resolve({ call, close: () => server.close() });
    });
  });

const users = {
  admin: { _id: OID, name: "Admin", role: "admin" },
  hr: { _id: OID, name: "HR", role: "hr" },
  employee: { _id: OID, name: "Emp", role: "employee", employee: OID },
  unlinked: { _id: OID, name: "Emp", role: "employee" },
};

module.exports = { start, users, OID };
