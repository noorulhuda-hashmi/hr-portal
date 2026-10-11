const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Holiday = require("../models/Holiday");
const Payslip = require("../models/Payslip");
const { localDateString, localTimeString } = require("../utils/date");
const { getBalance } = require("../utils/leaveBalance");
const { notifyHR } = require("../utils/notify");
const audit = require("../utils/audit");
const { submitLeave } = require("./leaveController");

const getProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.employeeId).populate("department", "name");
    if (!employee) {
      res.status(404);
      throw new Error("Employee record not found");
    }
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

// ?month=YYYY-MM (default: is mahine), sirf apni attendance
const getMyAttendance = async (req, res, next) => {
  try {
    const month = req.query.month || localDateString().slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      res.status(400);
      throw new Error("Month must be in YYYY-MM format");
    }
    const records = await Attendance.find({
      employee: req.employeeId,
      date: { $gte: `${month}-01`, $lte: `${month}-31` },
    }).sort("date");

    const summary = { present: 0, late: 0, absent: 0 };
    records.forEach((r) => (summary[r.status] += 1));
    res.json({ month, summary, records });
  } catch (err) {
    next(err);
  }
};

const getMyLeaves = async (req, res, next) => {
  try {
    res.json(await Leave.find({ employee: req.employeeId }).sort("-createdAt"));
  } catch (err) {
    next(err);
  }
};

// Employee sirf apne naam par leave maang sakta hai (body ka employee ignore hota hai)
const applyLeave = async (req, res, next) => {
  try {
    const leave = await submitLeave(res, { ...req.body, employee: req.employeeId });
    audit(req, "Leave requested", `${leave.leaveType} ${leave.startDate} to ${leave.endDate}`);
    notifyHR(`${req.user.name} requested ${leave.leaveType} leave (${leave.startDate} to ${leave.endDate}).`, "/leaves");
    res.status(201).json(leave);
  } catch (err) {
    next(err);
  }
};

const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findOne({ _id: req.params.id, employee: req.employeeId });
    if (!leave) {
      res.status(404);
      throw new Error("Leave request not found");
    }
    if (leave.status !== "pending") {
      res.status(400);
      throw new Error("Only pending requests can be cancelled");
    }
    await leave.deleteOne();
    audit(req, "Leave request cancelled", `${leave.leaveType} ${leave.startDate} to ${leave.endDate}`);
    res.json({ message: "Leave request cancelled" });
  } catch (err) {
    next(err);
  }
};

const onApprovedLeave = (employee, date) =>
  Leave.findOne({ employee, status: "approved", startDate: { $lte: date }, endDate: { $gte: date } });

// Employee ka home: aaj ki halat, is mahine ki attendance, leave ka hisaab
const getDashboard = async (req, res, next) => {
  try {
    const today = localDateString();
    const month = today.slice(0, 7);
    const [todayRecord, monthRecords, balance, pendingLeaves, leaveToday, upcoming, holidayToday, nextHolidays] = await Promise.all([
      Attendance.findOne({ employee: req.employeeId, date: today }),
      Attendance.find({ employee: req.employeeId, date: { $gte: `${month}-01`, $lte: `${month}-31` } }),
      getBalance(req.employeeId),
      Leave.countDocuments({ employee: req.employeeId, status: "pending" }),
      onApprovedLeave(req.employeeId, today),
      Leave.find({ employee: req.employeeId, status: "approved", endDate: { $gte: today } })
        .sort("startDate")
        .limit(3),
      Holiday.findOne({ date: today }),
      Holiday.find({ date: { $gt: today } }).sort("date").limit(3),
    ]);

    const summary = { present: 0, late: 0, absent: 0 };
    monthRecords.forEach((r) => (summary[r.status] += 1));

    res.json({
      today,
      month,
      lateAfter: Attendance.LATE_AFTER,
      todayRecord,
      onLeaveToday: !!leaveToday,
      summary,
      balance,
      pendingLeaves,
      upcoming,
      holidayToday: holidayToday ? holidayToday.name : null,
      nextHolidays,
    });
  } catch (err) {
    next(err);
  }
};

const getLeaveBalance = async (req, res, next) => {
  try {
    res.json(await getBalance(req.employeeId));
  } catch (err) {
    next(err);
  }
};

// Employee khud check-in karta hai: waqt server se aata hai, user nahi likhta
const checkIn = async (req, res, next) => {
  try {
    if (!(await Employee.exists({ _id: req.employeeId, status: "active" }))) {
      res.status(403);
      throw new Error("Your employee record is not active");
    }
    const today = localDateString();
    if (await onApprovedLeave(req.employeeId, today)) {
      res.status(400);
      throw new Error("You are on approved leave today");
    }
    const holiday = await Holiday.findOne({ date: today });
    if (holiday) {
      res.status(400);
      throw new Error(`Today is a holiday (${holiday.name})`);
    }
    const existing = await Attendance.findOne({ employee: req.employeeId, date: today });
    if (existing) {
      res.status(400);
      throw new Error(
        existing.checkIn
          ? `You already checked in today at ${existing.checkIn}`
          : "HR has already marked your attendance today. Please contact HR"
      );
    }
    const doc = await Attendance.create({ employee: req.employeeId, date: today, checkIn: localTimeString() });
    audit(req, "Checked in", `${doc.date} ${doc.checkIn} (${doc.status})`);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const today = localDateString();
    const doc = await Attendance.findOne({ employee: req.employeeId, date: today });
    if (!doc || !doc.checkIn) {
      res.status(400);
      throw new Error("Please check in first");
    }
    if (doc.checkOut) {
      res.status(400);
      throw new Error(`You already checked out today at ${doc.checkOut}`);
    }
    const time = localTimeString();
    if (time <= doc.checkIn) {
      res.status(400);
      throw new Error("Please wait a minute before checking out");
    }
    doc.checkOut = time;
    await doc.save();
    audit(req, "Checked out", `${doc.date} ${doc.checkOut}`);
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// Employee sirf apni paid payslips dekh sakta hai
const getMyPayslips = async (req, res, next) => {
  try {
    res.json(await Payslip.find({ employee: req.employeeId, status: "paid" }).sort("-month"));
  } catch (err) {
    next(err);
  }
};

const getMyPayslip = async (req, res, next) => {
  try {
    const slip = await Payslip.findOne({ _id: req.params.id, employee: req.employeeId, status: "paid" }).populate({
      path: "employee",
      select: "employeeId firstName lastName designation department",
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

module.exports = {
  getMyPayslips,
  getMyPayslip,
  getDashboard,
  getLeaveBalance,
  checkIn,
  checkOut, getProfile, getMyAttendance, getMyLeaves, applyLeave, cancelLeave };
