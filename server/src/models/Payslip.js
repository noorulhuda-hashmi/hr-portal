const mongoose = require("mongoose");
const { computeNet } = require("../utils/payroll");

const money = (label) => ({
  type: Number,
  default: 0,
  min: [0, `${label} cannot be negative`],
  max: [100000000, `${label} is too large`],
});

const payslipSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: [true, "Employee is required"] },
    month: {
      type: String,
      required: [true, "Month is required"],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"],
    },
    basicSalary: { ...money("Basic salary"), default: undefined, required: [true, "Basic salary is required"] },
    allowances: money("Allowances"),
    bonus: money("Bonus"),
    otherDeductions: money("Other deductions"),
    absentDays: { type: Number, default: 0, min: 0, max: 31 },
    unpaidLeaveDays: { type: Number, default: 0, min: 0, max: 31 },
    absentDeduction: { type: Number, default: 0 },
    unpaidLeaveDeduction: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "paid"], default: "draft" },
    paidAt: { type: Date },
    note: { type: String, trim: true, maxlength: [200, "Note cannot exceed 200 characters"] },
  },
  { timestamps: true }
);

payslipSchema.index({ employee: 1, month: 1 }, { unique: true });

// Net salary hamesha yahin se nikalti hai, kisi se likhwai nahi jati
payslipSchema.pre("validate", function (next) {
  const r = computeNet(this);
  this.absentDeduction = r.absentDeduction;
  this.unpaidLeaveDeduction = r.unpaidLeaveDeduction;
  this.netSalary = r.net;
  if (r.net < 0) this.invalidate("otherDeductions", "Deductions cannot be more than total earnings");
  next();
});

module.exports = mongoose.model("Payslip", payslipSchema);
