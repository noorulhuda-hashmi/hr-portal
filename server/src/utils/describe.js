const Employee = require("../models/Employee");

// Log mein "EMP-0002 ayesha ahmed" likhne ke liye (id ke bajaye naam)
const employeeLabel = async (id) => {
  const e = await Employee.findById(id).select("employeeId firstName lastName").catch(() => null);
  return e ? `${e.employeeId} ${e.firstName} ${e.lastName}` : "unknown employee";
};

module.exports = { employeeLabel };
