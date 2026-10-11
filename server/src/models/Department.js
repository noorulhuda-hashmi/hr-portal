const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Department name must be at least 2 characters"],
      maxlength: [60, "Department name is too long"],
    },
    description: { type: String, trim: true, maxlength: [200, "Description is too long"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
