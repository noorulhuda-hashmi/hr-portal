// Aaj ki tareekh "YYYY-MM-DD" mein, computer ke apne waqt ke mutabiq
const localDateString = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Abhi ka waqt "HH:MM" mein
const localTimeString = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Sirf format nahi, asli calendar date bhi (jaise 2026-02-30 galat hai)
const isRealDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime()) && localDateString(d) === value;
};

const isMonth = (v) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v || "");

// "2026-10" -> { from: "2026-10-01", to: "2026-10-31" }
const monthRange = (month) => {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
};

// Do tareekh-ranges ke darmiyan kitne din common hain (dono sire shamil)
const overlapDays = (start, end, from, to) => {
  const s = start < from ? from : start;
  const e = end > to ? to : end;
  if (e < s) return 0;
  return Math.round((new Date(`${e}T00:00:00`) - new Date(`${s}T00:00:00`)) / 86400000) + 1;
};

module.exports = { localDateString, localTimeString, isRealDate, isMonth, monthRange, overlapDays };
