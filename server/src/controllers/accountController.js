const Employee = require("../models/Employee");
const User = require("../models/User");
const audit = require("../utils/audit");

const findEmployee = async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }
  return employee;
};

const checkPassword = (res, password) => {
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }
};

// Is employee ka login hai ya nahi
const getAccount = async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    const user = await User.findOne({ employee: employee._id });
    res.json({ exists: !!user, email: user?.email || employee.email });
  } catch (err) {
    next(err);
  }
};

// Employee ke email par login banata hai
const createAccount = async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    checkPassword(res, req.body.password);

    if (await User.findOne({ employee: employee._id })) {
      res.status(400);
      throw new Error("This employee already has a login");
    }
    if (await User.findOne({ email: employee.email })) {
      res.status(400);
      throw new Error("A user with this email already exists");
    }

    const user = await User.create({
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      password: req.body.password,
      role: "employee",
      employee: employee._id,
    });
    audit(req, "Login created", `${employee.employeeId} ${user.email}`);
    res.status(201).json({ exists: true, email: user.email });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    checkPassword(res, req.body.password);

    const user = await User.findOne({ employee: employee._id });
    if (!user) {
      res.status(404);
      throw new Error("This employee has no login yet");
    }
    user.password = req.body.password;
    await user.save();
    audit(req, "Password reset by HR", `${employee.employeeId} ${employee.firstName} ${employee.lastName}`);
    res.json({ message: "Password reset" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAccount, createAccount, resetPassword };
