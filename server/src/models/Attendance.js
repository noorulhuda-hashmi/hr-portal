const mongoose = require("mongoose");
const { localDateString, isRealDate } = require("../utils/date");

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Is waqt ke baad check-in ho to "late" shumar hota hai (.env mein LATE_AFTER se badal sakte hain)
const LATE_AFTER = process.env.LATE_AFTER || "09:15";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
    },
    // "YYYY-MM-DD" string: timezone ki ulajhan nahi, aur ek din ka ek hi record
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [DATE_RX, "Date must be in YYYY-MM-DD format"],
      validate: [
        { validator: (v) => isRealDate(v), message: "Date is not a valid calendar date" },
        {
          validator: (v) => v <= localDateString(),
          message: "Attendance date cannot be in the future",
        },
      ],
    },
    checkIn: { type: String, match: [TIME_RX, "Check-in must be a time like 09:05"] },
    checkOut: { type: String, match: [TIME_RX, "Check-out must be a time like 17:30"] },
    status: {
      type: String,
      enum: { values: ["present", "late", "absent"], message: "Status must be present, late or absent" },
    },
  },
  { timestamps: true }
);

// Ek employee ka ek din mein sirf ek record
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.pre("validate", function (next) {
  // Status na diya ho to check-in se khud nikalte hain
  if (!this.status) {
    this.status = this.checkIn ? (this.checkIn > LATE_AFTER ? "late" : "present") : "absent";
  }

  if (this.checkOut && !this.checkIn) {
    this.invalidate("checkOut", "Check-out needs a check-in time");
  } else if (this.checkIn && this.checkOut && this.checkOut <= this.checkIn) {
    this.invalidate("checkOut", "Check-out must be after check-in");
  } else if (this.status === "absent" && (this.checkIn || this.checkOut)) {
    this.invalidate("status", "An absent record cannot have check-in or check-out times");
  }
  next();
});

attendanceSchema.statics.LATE_AFTER = LATE_AFTER;

module.exports = mongoose.model("Attendance", attendanceSchema);
