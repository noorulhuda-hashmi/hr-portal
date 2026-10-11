const Payslip = require("../models/Payslip");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const audit = require("../utils/audit");
const { employeeLabel } = require("../utils/describe");
const { notifyEmployee } = require("../utils/notify");
const { localDateString, isMonth, monthRange, overlapDays } = require("../utils/date");

const checkMonth = (res, month) => {
  if (!isMonth(month)) {
    res.status(400);
    throw new Error("Month must be in YYYY-MM format");
  }
  if (month > localDateString().slice(0, 7)) {
    res.status(400);
    throw new Error("Payroll cannot be generated for a future month");
  }
};

const EMP_FIELDS = "employeeId firstName lastName designation department";

const getPayroll = async (req, res, next) => {
  try {
    const month = req.query.month || localDateString().slice(0, 7);
    if (!isMonth(month)) {
      res.status(400);
      throw new Error("Month must be in YYYY-MM format");
    }
    const slips = await Payslip.find({ month })
      .populate({ path: "employee", select: EMP_FIELDS, populate: { path: "department", select: "name" } })
      .sort("createdAt");

    const totals = slips.reduce(
      (t, s) => ({ net: t.net + s.netSalary, paid: t.paid + (s.status === "paid" ? s.netSalary : 0) }),
      { net: 0, paid: 0 }
    );
    res.json({ month, totals, slips });
  } catch (err) {
    next(err);
  }
};

// Active employees ke is mahine ke draft payslips banata hai ya naye din/salary se taza karta hai.
// Paid payslip ko haath nahi lagata.
const generatePayroll = async (req, res, next) => {
  try {
    const { month } = req.body;
    checkMonth(res, month);
    const { from, to } = monthRange(month);

    const employees = await Employee.find({ status: "active" });
    const result = { month, created: 0, refreshed: 0, skippedPaid: 0, skippedNoSalary: 0 };

    for (const emp of employees) {
      if (!emp.salary || emp.salary <= 0) {
        result.skippedNoSalary += 1;
        continue;
      }

      const absentDays = await Attendance.countDocuments({
        employee: emp._id,
        status: "absent",
        date: { $gte: from, $lte: to },
      });
      const unpaidLeaves = await Leave.find({
        employee: emp._id,
        status: "approved",
        leaveType: "unpaid",
        startDate: { $lte: to },
        endDate: { $gte: from },
      });
      const unpaidLeaveDays = Math.min(
        unpaidLeaves.reduce((sum, l) => sum + overlapDays(l.startDate, l.endDate, from, to), 0),
        31
      );

      let slip = await Payslip.findOne({ employee: emp._id, month });
      if (slip && slip.status === "paid") {
        result.skippedPaid += 1;
        continue;
      }
      if (slip) {
        result.refreshed += 1;
      } else {
        slip = new Payslip({ employee: emp._id, month });
        result.created += 1;
      }
      slip.basicSalary = emp.salary;
      slip.absentDays = absentDays;
      slip.unpaidLeaveDays = unpaidLeaveDays;
      await slip.save();
    }

    audit(req, "Payroll generated", `${month}: ${result.created} created, ${result.refreshed} refreshed`);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const findSlip = async (req, res) => {
  const slip = await Payslip.findById(req.params.id);
  if (!slip) {
    res.status(404);
    throw new Error("Payslip not found");
  }
  return slip;
};

const getPayslip = async (req, res, next) => {
  try {
    const slip = await Payslip.findById(req.params.id).populate({
      path: "employee",
      select: EMP_FIELDS,
      populate: { path: "department", select: "name" },
    });
    if (!slip) {
      res.status(404);
      throw new Error("Payslip not found");
    }
    res.json(slip);
  } catch (err) {
    next(err);
  }
};

// Draft payslip mein allowances, bonus, other deductions aur note badalna
const updatePayslip = async (req, res, next) => {
  try {
    const slip = await findSlip(req, res);
    if (slip.status === "paid") {
      res.status(400);
      throw new Error("A paid payslip cannot be changed");
    }
    for (const key of ["allowances", "bonus", "otherDeductions"]) {
      if (req.body[key] === undefined || req.body[key] === "") continue;
      const value = Number(req.body[key]);
      if (!Number.isFinite(value)) {
        res.status(400);
        throw new Error(`${key} must be a number`);
      }
      slip[key] = value;
    }
    if (req.body.note !== undefined) slip.note = req.body.note || undefined;
    await slip.save();
    audit(req, "Payslip edited", `${await employeeLabel(slip.employee)}: ${slip.month}, net ${slip.netSalary}`);
    res.json(slip);
  } catch (err) {
    next(err);
  }
};

const markPaid = async (req, res, next) => {
  try {
    const slip = await findSlip(req, res);
    if (slip.status === "paid") {
      res.status(400);
      throw new Error("This payslip is already paid");
    }
    slip.status = "paid";
    slip.paidAt = new Date();
    await slip.save();
    audit(req, "Payslip marked paid", `${await employeeLabel(slip.employee)}: ${slip.month}, net ${slip.netSalary}`);
    notifyEmployee(slip.employee, `Your payslip for ${slip.month} is ready.`, `/my/payslips/${slip._id}`);
    res.json(slip);
  } catch (err) {
    next(err);
  }
};

const deletePayslip = async (req, res, next) => {
  try {
    const slip = await findSlip(req, res);
    if (slip.status === "paid") {
      res.status(400);
      throw new Error("A paid payslip cannot be deleted");
    }
    await slip.deleteOne();
    audit(req, "Draft payslip deleted", `${await employeeLabel(slip.employee)}: ${slip.month}`);
    res.json({ message: "Payslip deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPayroll, generatePayroll, getPayslip, updatePayslip, markPaid, deletePayslip };
