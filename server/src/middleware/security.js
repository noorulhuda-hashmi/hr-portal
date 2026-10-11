const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const isTest = process.env.NODE_ENV === "test";

// Security headers (clickjacking, MIME sniffing waghera). API ko doosre origin se bhi chalne dete hain (CORS alag set hai)
const securityHeaders = helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } });

const tooMany = (message) => (req, res) => res.status(429).json({ message });

// Password guess karne walon ke liye: ek IP se 15 minute mein 20 login koshishein
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_LIMIT) || 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  handler: tooMany("Too many login attempts. Please try again in 15 minutes"),
});

// Poori API par aam hadd
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_LIMIT) || 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  handler: tooMany("Too many requests. Please slow down"),
});

// MongoDB operator injection se bachao: {"email": {"$gt": ""}} jaisi cheezein hata deta hai
const clean = (value) => {
  if (!value || typeof value !== "object" || Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) return value.map(clean);
  const out = {};
  for (const [key, v] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    out[key] = clean(v);
  }
  return out;
};

const sanitize = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);
  next();
};

module.exports = { securityHeaders, loginLimiter, apiLimiter, sanitize, clean };
