const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Holiday = require("../models/Holiday");
const audit = require("../utils/audit");
const { employeeLabel } = require("../utils/describe");
const { localDateString } = require("../utils/date");

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

// Ek din ki attendance: sab active employees, har ek ke saath uska record (ya null)
const getDaily = async (req, res, next) => {
  try {
    const date = req.query.date || localDateString();
    if (!DATE_RX.test(date)) {
      res.status(400);
      throw new Error("Date must be in YYYY-MM-DD format");
    }

    const [employees, records, leaves, holiday] = await Promise.all([
      Employee.find({ status: "active" }).populate("department", "name").sort("firstName"),
      Attendance.find({ date }),
      Leave.find({ status: "approved", startDate: { $lte: date }, endDate: { $gte: date } }),
      Holiday.findOne({ date }),
    ]);

    const byEmployee = new Map(records.map((r) => [String(r.employee), r]));
    const onLeaveIds = new Set(leaves.map((l) => String(l.employee)));
    const summary = { total: employees.length, present: 0, late: 0, absent: 0, onLeave: 0, notMarked: 0 };

    const rows = employees.map((e) => {
      const record = byEmployee.get(String(e._id)) || null;
      // Record ho to wahi chalta hai; warna approved leave ho to "on leave", warna not marked
      const onLeave = !record && onLeaveIds.has(String(e._id));
      if (record) summary[record.status] += 1;
      else if (onLeave) summary.onLeave += 1;
      else if (!holiday) summary.notMarked += 1; // chhutti ke din "not marked" nahi ginte
      return {
        onLeave,
        employee: {
          _id: e._id,
          employeeId: e.employeeId,
          firstName: e.firstName,
          lastName: e.lastName,
          department: e.department,
        },
        record,
      };
    });

    res.json({ date, holiday: holiday ? holiday.name : null, lateAfter: Attendance.LATE_AFTER, summary, rows });
  } catch (err) {
    next(err);
  }
};

// Naya record banata hai, ya us din ka purana record update karta hai
const markAttendance = async (req, res, next) => {
  try {
    const { employee, date, checkIn, checkOut, status } = req.body;

    if (!employee) {
      res.status(400);
      throw new Error("Employee is required");
    }
    if (!(await Employee.exists({ _id: employee }))) {
      res.status(404);
      throw new Error("Employee not found");
    }

    let doc = await Attendance.findOne({ employee, date });
    const isNew = !doc;
    if (!doc) doc = new Attendance({ employee, date });

    doc.checkIn = checkIn || undefined;
    doc.checkOut = checkOut || undefined;
    doc.status = status || undefined; // khali ho to model khud nikalta hai

    await doc.save();
    audit(req, isNew ? "Attendance marked" : "Attendance edited", `${await employeeLabel(employee)}: ${date} (${doc.status})`);
    res.status(isNew ? 201 : 200).json(doc);
  } catch (err) {
    next(err);
  }
};

const deleteAttendance = async (req, res, next) => {
  try {
    const doc = await Attendance.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404);
      throw new Error("Attendance record not found");
    }
    audit(req, "Attendance cleared", `${await employeeLabel(doc.employee)}: ${doc.date}`);
    res.json({ message: "Attendance record deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDaily, markAttendance, deleteAttendance };
