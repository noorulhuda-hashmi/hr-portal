const EmployeeDocument = require("../models/EmployeeDocument");
const Employee = require("../models/Employee");
const audit = require("../utils/audit");
const { notifyHR } = require("../utils/notify");
const { employeeLabel } = require("../utils/describe");

const MAX_PER_EMPLOYEE = 10;

// File ki pehchan uske pehle bytes se, sirf naam ya header par bharosa nahi
const SIGNATURES = {
  "application/pdf": (b) => b.subarray(0, 4).toString("latin1") === "%PDF",
  "image/png": (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
};

const cleanName = (name) =>
  String(name || "document")
    .replace(/[\u0000-\u001f\\/:*?"<>|]/g, "_")
    .trim()
    .slice(0, 100) || "document";

const LIST_FIELDS = "-data";

const listFor = (employeeId) => EmployeeDocument.find({ employee: employeeId }).select(LIST_FIELDS).sort("-createdAt");

// Upload ka asli kaam: HR aur employee dono yahin se guzarte hain
const saveUpload = async (req, res, employeeId) => {
  const body = req.body;
  if (!Buffer.isBuffer(body) || body.length === 0) {
    res.status(400);
    throw new Error("Please choose a file to upload");
  }
  const mimeType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (!SIGNATURES[mimeType]) {
    res.status(400);
    throw new Error("Only PDF, PNG or JPG files are allowed");
  }
  if (!SIGNATURES[mimeType](body)) {
    res.status(400);
    throw new Error("The file content does not match its type");
  }
  if (await EmployeeDocument.countDocuments({ employee: employeeId }) >= MAX_PER_EMPLOYEE) {
    res.status(400);
    throw new Error(`Maximum ${MAX_PER_EMPLOYEE} documents per employee. Delete one first`);
  }

  const doc = await EmployeeDocument.create({
    employee: employeeId,
    category: req.query.category,
    originalName: cleanName(req.query.name),
    mimeType,
    size: body.length,
    data: body,
    uploadedBy: req.user._id,
    uploadedByName: req.user.name,
    uploadedByRole: req.user.role,
  });
  return doc;
};

const sendFile = async (res, doc) => {
  res.set({
    "Content-Type": doc.mimeType,
    "Content-Length": doc.data.length,
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
    "X-Content-Type-Options": "nosniff",
  });
  res.send(doc.data);
};

const notFound = (res) => {
  res.status(404);
  throw new Error("Document not found");
};

/* ---------- HR / admin ---------- */

const listForEmployee = async (req, res, next) => {
  try {
    if (!(await Employee.exists({ _id: req.params.id }))) {
      res.status(404);
      throw new Error("Employee not found");
    }
    res.json(await listFor(req.params.id));
  } catch (err) {
    next(err);
  }
};

const uploadForEmployee = async (req, res, next) => {
  try {
    if (!(await Employee.exists({ _id: req.params.id }))) {
      res.status(404);
      throw new Error("Employee not found");
    }
    const doc = await saveUpload(req, res, req.params.id);
    audit(req, "Document uploaded by HR", `${await employeeLabel(req.params.id)}: ${doc.category}, ${doc.originalName}`);
    res.status(201).json({ ...doc.toObject(), data: undefined });
  } catch (err) {
    next(err);
  }
};

const downloadAny = async (req, res, next) => {
  try {
    const doc = await EmployeeDocument.findById(req.params.id).select("+data");
    if (!doc) notFound(res);
    await sendFile(res, doc);
  } catch (err) {
    next(err);
  }
};

const deleteAny = async (req, res, next) => {
  try {
    const doc = await EmployeeDocument.findByIdAndDelete(req.params.id).select(LIST_FIELDS);
    if (!doc) notFound(res);
    audit(req, "Document deleted", `${await employeeLabel(doc.employee)}: ${doc.category}, ${doc.originalName}`);
    res.json({ message: "Document deleted" });
  } catch (err) {
    next(err);
  }
};

/* ---------- Employee (sirf apne) ---------- */

const listMine = async (req, res, next) => {
  try {
    res.json(await listFor(req.employeeId));
  } catch (err) {
    next(err);
  }
};

const uploadMine = async (req, res, next) => {
  try {
    const doc = await saveUpload(req, res, req.employeeId);
    audit(req, "Document uploaded", `${doc.category}, ${doc.originalName}`);
    notifyHR(`${req.user.name} uploaded a ${doc.category} document.`, `/employees/${req.employeeId}`);
    res.status(201).json({ ...doc.toObject(), data: undefined });
  } catch (err) {
    next(err);
  }
};

const downloadMine = async (req, res, next) => {
  try {
    const doc = await EmployeeDocument.findOne({ _id: req.params.id, employee: req.employeeId }).select("+data");
    if (!doc) notFound(res);
    await sendFile(res, doc);
  } catch (err) {
    next(err);
  }
};

// Employee sirf wo file hata sakta hai jo usne khud upload ki thi
const deleteMine = async (req, res, next) => {
  try {
    const doc = await EmployeeDocument.findOne({ _id: req.params.id, employee: req.employeeId }).select(LIST_FIELDS);
    if (!doc) notFound(res);
    if (String(doc.uploadedBy) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Only HR can delete a document that HR uploaded");
    }
    await doc.deleteOne();
    audit(req, "Document deleted", `${doc.category}, ${doc.originalName}`);
    res.json({ message: "Document deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listForEmployee,
  uploadForEmployee,
  downloadAny,
  deleteAny,
  listMine,
  uploadMine,
  downloadMine,
  deleteMine,
};
