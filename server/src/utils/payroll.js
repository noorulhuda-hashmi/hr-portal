// Ek mahine ki salary ka hisaab. Ek din ki salary = basic / 30
const DAYS_IN_MONTH = 30;

const computeNet = ({ basicSalary = 0, allowances = 0, bonus = 0, otherDeductions = 0, absentDays = 0, unpaidLeaveDays = 0 }) => {
  const gross = basicSalary + allowances + bonus;
  const perDay = basicSalary / DAYS_IN_MONTH;

  // Khud kati hui rakam kabhi total kamai se zyada nahi hoti
  const absentDeduction = Math.min(Math.round(perDay * absentDays), gross);
  const unpaidLeaveDeduction = Math.min(Math.round(perDay * unpaidLeaveDays), gross - absentDeduction);
  const totalDeductions = absentDeduction + unpaidLeaveDeduction + otherDeductions;

  return { gross, absentDeduction, unpaidLeaveDeduction, totalDeductions, net: gross - totalDeductions };
};

module.exports = { computeNet, DAYS_IN_MONTH };
