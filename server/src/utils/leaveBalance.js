const Leave = require("../models/Leave");

// Saal ki leaves (din). unpaid ki koi had nahi (null)
const ALLOWANCE = { annual: 14, sick: 10, casual: 8, unpaid: null };
const DAY = 86400000;
const toDate = (s) => new Date(`${s}T00:00:00`);

// Leave ke kitne din is saal mein aate hain (saal ki hadd se kaat kar)
const daysInYear = (start, end, year) => {
  const ys = `${year}-01-01`;
  const ye = `${year}-12-31`;
  const s = start < ys ? ys : start;
  const e = end > ye ? ye : end;
  if (e < s) return 0;
  return Math.round((toDate(e) - toDate(s)) / DAY) + 1;
};

const yearsBetween = (start, end) => {
  const years = [];
  for (let y = Number(start.slice(0, 4)); y <= Number(end.slice(0, 4)); y += 1) years.push(y);
  return years;
};

// Ek employee ka saal bhar ka hisaab (approved aur pending alag)
const getBalance = async (employee, year = new Date().getFullYear()) => {
  const leaves = await Leave.find({
    employee,
    status: { $in: ["pending", "approved"] },
    startDate: { $lte: `${year}-12-31` },
    endDate: { $gte: `${year}-01-01` },
  });

  const balances = Object.keys(ALLOWANCE).map((type) => {
    let approved = 0;
    let pending = 0;
    leaves
      .filter((l) => l.leaveType === type)
      .forEach((l) => {
        const d = daysInYear(l.startDate, l.endDate, year);
        if (l.status === "approved") approved += d;
        else pending += d;
      });
    const allowance = ALLOWANCE[type];
    return {
      type,
      allowance,
      approved,
      pending,
      remaining: allowance === null ? null : Math.max(allowance - approved - pending, 0),
    };
  });
  return { year, balances };
};

// Nayi request itni leave maangti hai jitni baqi hai usse zyada to error
const assertWithinBalance = async (res, employee, leaveType, startDate, endDate) => {
  const allowance = ALLOWANCE[leaveType];
  if (allowance === null || allowance === undefined) return;

  for (const year of yearsBetween(startDate, endDate)) {
    const { balances } = await getBalance(employee, year);
    const b = balances.find((x) => x.type === leaveType);
    const wanted = daysInYear(startDate, endDate, year);
    if (wanted > b.remaining) {
      res.status(400);
      throw new Error(
        `Not enough ${leaveType} leave for ${year}: ${b.remaining} day(s) left, ${wanted} requested`
      );
    }
  }
};

module.exports = { ALLOWANCE, getBalance, assertWithinBalance };
