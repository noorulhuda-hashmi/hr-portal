const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const { localDateString, isMonth, monthRange, overlapDays } = require("../utils/date");

// Ek mahine ki attendance ka khulasa har active employee ke liye
const attendanceReport = async (req, res, next) => {
  try {
    const month = req.query.month || localDateString().slice(0, 7);
    if (!isMonth(month)) {
      res.status(400);
      throw new Error("Month must be in YYYY-MM format");
    }
    const { from, to } = monthRange(month);

    const [employees, records, leaves] = await Promise.all([
      Employee.find({ status: "active" }).populate("department", "name").sort("employeeId"),
      Attendance.find({ date: { $gte: from, $lte: to } }),
      Leave.find({ status: "approved", startDate: { $lte: to }, endDate: { $gte: from } }),
    ]);

    const rows = employees.map((e) => {
      const mine = records.filter((r) => String(r.employee) === String(e._id));
      const count = (status) => mine.filter((r) => r.status === status).length;
      const leaveDays = leaves
        .filter((l) => String(l.employee) === String(e._id))
        .reduce((sum, l) => sum + overlapDays(l.startDate, l.endDate, from, to), 0);
      return {
        employeeId: e.employeeId,
        name: `${e.firstName} ${e.lastName}`,
        department: e.department?.name || "",
        present: count("present"),
        late: count("late"),
        absent: count("absent"),
        leaveDays,
      };
    });

    res.json({ month, rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { attendanceReport };
