const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const User = require("../models/User");
const Payslip = require("../models/Payslip");
const audit = require("../utils/audit");
const EmployeeDocument = require("../models/EmployeeDocument");

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// EMP-0001, EMP-0002 ... (skips ids that already exist)
const nextEmployeeId = async () => {
  let n = (await Employee.countDocuments()) + 1;
  let id = `EMP-${String(n).padStart(4, "0")}`;
  while (await Employee.exists({ employeeId: id })) {
    n += 1;
    id = `EMP-${String(n).padStart(4, "0")}`;
  }
  return id;
};

const getEmployees = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { firstName: rx },
        { lastName: rx },
        { email: rx },
        { employeeId: rx },
        { designation: rx },
      ];
    }
    const employees = await Employee.find(filter)
      .populate("department", "name")
      .sort("-createdAt");
    res.json(employees);
  } catch (err) {
    next(err);
  }
};

const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).populate("department", "name");
    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (!data.employeeId) data.employeeId = await nextEmployeeId();
    const employee = await Employee.create(data);
    audit(req, "Employee added", `${employee.employeeId} ${employee.firstName} ${employee.lastName}`);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }
    audit(req, "Employee updated", `${employee.employeeId} ${employee.firstName} ${employee.lastName}`);
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }
    // Us employee ke attendance records bhi hata do, taake adhoore record na rahen
    await Attendance.deleteMany({ employee: employee._id });
    await Leave.deleteMany({ employee: employee._id });
    await User.deleteMany({ employee: employee._id });
    await Payslip.deleteMany({ employee: employee._id });
    await EmployeeDocument.deleteMany({ employee: employee._id });
    audit(req, "Employee deleted", `${employee.employeeId} ${employee.firstName} ${employee.lastName}`);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
