const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const { assertWithinBalance } = require("../utils/leaveBalance");
const audit = require("../utils/audit");
const { employeeLabel } = require("../utils/describe");
const { notifyEmployee } = require("../utils/notify");

const getLeaves = async (req, res, next) => {
  try {
    const filter = {};
    if (["pending", "approved", "rejected"].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.employee) filter.employee = req.query.employee;

    const leaves = await Leave.find(filter)
      .populate("employee", "employeeId firstName lastName")
      .sort("-createdAt");
    res.json(leaves);
  } catch (err) {
    next(err);
  }
};

// HR aur employee dono isi se leave banate hain, taake rules ek hi rahen
const submitLeave = async (res, { employee, leaveType, startDate, endDate, reason }) => {
  if (!employee) {
    res.status(400);
    throw new Error("Employee is required");
  }
  if (!(await Employee.exists({ _id: employee, status: "active" }))) {
    res.status(404);
    throw new Error("Active employee not found");
  }

  const leave = new Leave({ employee, leaveType, startDate, endDate, reason });
  await leave.validate(); // tareekhon ke rules pehle, overlap check baad mein

  // Usi employee ki pending/approved leave se tareekhein na takrayein
  const clash = await Leave.findOne({
    employee,
    status: { $in: ["pending", "approved"] },
    startDate: { $lte: leave.endDate },
    endDate: { $gte: leave.startDate },
  });
  if (clash) {
    res.status(400);
    throw new Error(`Dates overlap with an existing ${clash.status} leave (${clash.startDate} to ${clash.endDate})`);
  }

  await assertWithinBalance(res, employee, leave.leaveType, leave.startDate, leave.endDate);

  await leave.save();
  return leave;
};

const createLeave = async (req, res, next) => {
  try {
    const leave = await submitLeave(res, req.body);
    audit(req, "Leave recorded by HR", `${await employeeLabel(leave.employee)}: ${leave.leaveType} ${leave.startDate} to ${leave.endDate}`);
    notifyEmployee(leave.employee, `HR recorded a ${leave.leaveType} leave for you (${leave.startDate} to ${leave.endDate}).`, "/my/leaves");
    res.status(201).json(leave);
  } catch (err) {
    next(err);
  }
};

// Sirf pending request ka faisla ho sakta hai: approve ya reject
const reviewLeave = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Decision must be approved or rejected");
    }
    if (status === "rejected" && !(reviewNote || "").trim()) {
      res.status(400);
      throw new Error("Please give a short note when rejecting a leave");
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404);
      throw new Error("Leave request not found");
    }
    if (leave.status !== "pending") {
      res.status(400);
      throw new Error(`This request is already ${leave.status}`);
    }

    leave.status = status;
    leave.reviewNote = reviewNote || undefined;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();
    audit(req, `Leave ${status}`, `${await employeeLabel(leave.employee)}: ${leave.leaveType} ${leave.startDate} to ${leave.endDate}`);
    notifyEmployee(
      leave.employee,
      `Your ${leave.leaveType} leave (${leave.startDate} to ${leave.endDate}) was ${status}.`,
      "/my/leaves"
    );
    res.json(leave);
  } catch (err) {
    next(err);
  }
};

// Faisla ho chuki leave ka record mehfooz rehta hai, sirf pending delete hoti hai
const deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404);
      throw new Error("Leave request not found");
    }
    if (leave.status !== "pending") {
      res.status(400);
      throw new Error("Only pending requests can be deleted");
    }
    await leave.deleteOne();
    audit(req, "Pending leave deleted", `${await employeeLabel(leave.employee)}: ${leave.leaveType} ${leave.startDate} to ${leave.endDate}`);
    res.json({ message: "Leave request deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaves, createLeave, reviewLeave, deleteLeave, submitLeave };
