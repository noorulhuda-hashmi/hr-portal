const jwt = require("jsonwebtoken");
const User = require("../models/User");
const audit = require("../utils/audit");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if ([name, email, password].some((v) => typeof v !== "string" || !v.trim())) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }
    if (role !== undefined && !["admin", "hr", "employee"].includes(role)) {
      res.status(400);
      throw new Error("Role must be admin, hr or employee");
    }
    if (await User.findOne({ email: email.toLowerCase().trim() })) {
      res.status(400);
      throw new Error("Email already registered");
    }
    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: signToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Sirf text qabool: object bhej kar login bypass ki koshish nahi chalegi
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400);
      throw new Error("Email and password are required");
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: signToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

const me = (req, res) => res.json(req.user);

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error("Current and new password are required");
    }
    if (newPassword.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }
    if (newPassword === currentPassword) {
      res.status(400);
      throw new Error("New password must be different from the current one");
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(currentPassword))) {
      res.status(400);
      throw new Error("Current password is incorrect");
    }
    user.password = newPassword;
    await user.save();
    audit(req, "Password changed", "own account");
    res.json({ message: "Password changed" });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, changePassword };
