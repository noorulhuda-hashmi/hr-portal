const mongoose = require("mongoose");
const { isRealDate } = require("../utils/date");

const LEAVE_TYPES = ["annual", "sick", "casual", "unpaid"];
const MAX_DAYS = 30;

// Dono tareekhon ke darmiyan din (dono din shamil)
const daysBetween = (start, end) =>
  Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000) + 1;

const dateRule = (label) => [
  { validator: (v) => isRealDate(v), message: `${label} is not a valid calendar date` },
];

const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: [true, "Employee is required"] },
    leaveType: {
      type: String,
      required: [true, "Leave type is required"],
      enum: { values: LEAVE_TYPES, message: "Leave type must be annual, sick, casual or unpaid" },
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"],
      validate: dateRule("Start date"),
    },
    endDate: {
      type: String,
      required: [true, "End date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"],
      validate: dateRule("End date"),
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      minlength: [5, "Reason must be at least 5 characters"],
      maxlength: [300, "Reason cannot exceed 300 characters"],
    },
    status: {
      type: String,
      enum: { values: ["pending", "approved", "rejected"], message: "Invalid status" },
      default: "pending",
    },
    reviewNote: { type: String, trim: true, maxlength: [200, "Note cannot exceed 200 characters"] },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, startDate: 1 });

leaveSchema.pre("validate", function (next) {
  if (isRealDate(this.startDate || "") && isRealDate(this.endDate || "")) {
    if (this.endDate < this.startDate) {
      this.invalidate("endDate", "End date cannot be before start date");
    } else if (daysBetween(this.startDate, this.endDate) > MAX_DAYS) {
      this.invalidate("endDate", `A leave request cannot be longer than ${MAX_DAYS} days`);
    }
  }
  next();
});

leaveSchema.virtual("days").get(function () {
  return daysBetween(this.startDate, this.endDate);
});
leaveSchema.set("toJSON", { virtuals: true });

leaveSchema.statics.LEAVE_TYPES = LEAVE_TYPES;

module.exports = mongoose.model("Leave", leaveSchema);
