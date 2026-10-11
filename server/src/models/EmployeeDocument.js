const mongoose = require("mongoose");

const CATEGORIES = ["cnic", "contract", "resume", "certificate", "other"];

// File ka asli data database mein hi rehta hai (chhoti files ke liye): alag disk ya service nahi chahiye
const employeeDocumentSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    category: {
      type: String,
      required: [true, "Document type is required"],
      enum: { values: CATEGORIES, message: "Document type must be cnic, contract, resume, certificate or other" },
    },
    originalName: { type: String, required: true, maxlength: 100 },
    mimeType: { type: String, required: true, enum: ["application/pdf", "image/png", "image/jpeg"] },
    size: { type: Number, required: true, min: 1 },
    data: { type: Buffer, required: true, select: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadedByName: { type: String, required: true },
    uploadedByRole: { type: String, required: true },
  },
  { timestamps: true }
);

employeeDocumentSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model("EmployeeDocument", employeeDocumentSchema);
