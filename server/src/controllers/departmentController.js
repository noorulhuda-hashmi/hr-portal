const Department = require("../models/Department");
const Employee = require("../models/Employee");
const audit = require("../utils/audit");

// Har department ke saath uske employees ki ginti bhi bhejte hain
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort("name").lean();
    const counts = await Employee.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json(
      departments.map((d) => ({ ...d, employeeCount: countMap.get(String(d._id)) || 0 }))
    );
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    audit(req, "Department added", dept.name);
    res.status(201).json(dept);
  } catch (err) {
    next(err);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!dept) {
      res.status(404);
      throw new Error("Department not found");
    }
    audit(req, "Department updated", dept.name);
    res.json(dept);
  } catch (err) {
    next(err);
  }
};

// Jis department mein employees hon use delete nahi karne dete
const deleteDepartment = async (req, res, next) => {
  try {
    const inUse = await Employee.countDocuments({ department: req.params.id });
    if (inUse > 0) {
      res.status(400);
      throw new Error(
        `Cannot delete: ${inUse} employee${inUse === 1 ? " is" : "s are"} in this department`
      );
    }
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      res.status(404);
      throw new Error("Department not found");
    }
    audit(req, "Department deleted", dept.name);
    res.json({ message: "Department deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
