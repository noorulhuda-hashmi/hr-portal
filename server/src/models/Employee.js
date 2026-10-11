const mongoose = require("mongoose");

const EMAIL_RX = /^\S+@\S+\.\S+$/;
const PHONE_RX = /^[0-9+\-\s()]{7,15}$/;

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    employeeId: { type: String, required: [true, "Employee ID is required"], unique: true, trim: true },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name must be at most 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [50, "Last name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_RX, "Enter a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
      match: [PHONE_RX, "Phone must be 7-15 characters (digits, +, -, spaces)"],
    },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: { values: ["male", "female", "other"], message: "Gender must be male, female or other" },
    },
    address: { type: String, trim: true, maxlength: [200, "Address is too long"] },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    designation: { type: String, trim: true, maxlength: [100, "Designation is too long"] },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, min: [0, "Salary cannot be negative"] },
    status: {
      type: String,
      enum: { values: ["active", "inactive"], message: "Status must be active or inactive" },
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
