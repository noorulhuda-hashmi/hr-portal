const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Holiday = require("../models/Holiday");
const { localDateString } = require("../utils/date");

const getStats = async (req, res, next) => {
  try {
    const today = localDateString();

    const [total, active, inactive, departments, byDepartment, recent, todayRecords] =
      await Promise.all([
        Employee.countDocuments(),
        Employee.countDocuments({ status: "active" }),
        Employee.countDocuments({ status: "inactive" }),
        Department.countDocuments(),
        Employee.aggregate([
          { $group: { _id: "$department", count: { $sum: 1 } } },
          { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
          {
            $project: {
              _id: 0,
              count: 1,
              name: { $ifNull: [{ $arrayElemAt: ["$dept.name", 0] }, "No department"] },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Employee.find().sort("-createdAt").limit(5).populate("department", "name"),
        Attendance.aggregate([
          { $match: { date: today } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

    // Aaj ki attendance: jin active employees ka record nahi, wo "notMarked" hain
    // Jin ki approved leave aaj hai aur record nahi, wo "onLeave" hain
    const attendanceToday = { present: 0, late: 0, absent: 0, onLeave: 0, notMarked: 0 };
    todayRecords.forEach((r) => {
      attendanceToday[r._id] = r.count;
    });
    const [activeEmployees, leavesToday, recordsToday, holidayToday] = await Promise.all([
      Employee.find({ status: "active" }).select("_id"),
      Leave.find({ status: "approved", startDate: { $lte: today }, endDate: { $gte: today } }),
      Attendance.find({ date: today }).select("employee"),
      Holiday.findOne({ date: today }),
    ]);
    const activeIds = new Set(activeEmployees.map((e) => String(e._id)));
    const recorded = new Set(recordsToday.map((r) => String(r.employee)));
    const onLeaveIds = new Set(
      leavesToday.map((l) => String(l.employee)).filter((id) => activeIds.has(id) && !recorded.has(id))
    );
    attendanceToday.onLeave = onLeaveIds.size;
    const marked = attendanceToday.present + attendanceToday.late + attendanceToday.absent;
    attendanceToday.notMarked = holidayToday ? 0 : Math.max(active - marked - attendanceToday.onLeave, 0);

    res.json({
      total,
      active,
      inactive,
      departments,
      byDepartment,
      recent,
      attendanceToday,
      holidayToday: holidayToday ? holidayToday.name : null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
