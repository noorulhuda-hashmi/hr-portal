const mongoose = require("mongoose");
const { isRealDate } = require("../utils/date");

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
      minlength: [2, "Holiday name must be at least 2 characters"],
      maxlength: [80, "Holiday name cannot exceed 80 characters"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      unique: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
      validate: [{ validator: (v) => isRealDate(v), message: "Date is not a valid calendar date" }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holiday", holidaySchema);
