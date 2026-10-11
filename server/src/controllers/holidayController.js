const Holiday = require("../models/Holiday");
const audit = require("../utils/audit");

// ?year=2026 (default: sab), tareekh ke hisaab se
const getHolidays = async (req, res, next) => {
  try {
    const filter = {};
    if (/^\d{4}$/.test(req.query.year || "")) {
      filter.date = { $gte: `${req.query.year}-01-01`, $lte: `${req.query.year}-12-31` };
    }
    res.json(await Holiday.find(filter).sort("date"));
  } catch (err) {
    next(err);
  }
};

const createHoliday = async (req, res, next) => {
  try {
    const { name, date } = req.body;
    const holiday = await Holiday.create({ name, date });
    audit(req, "Holiday added", `${holiday.name} (${holiday.date})`);
    res.status(201).json(holiday);
  } catch (err) {
    next(err);
  }
};

const deleteHoliday = async (req, res, next) => {
  try {
    const doc = await Holiday.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404);
      throw new Error("Holiday not found");
    }
    audit(req, "Holiday deleted", `${doc.name} (${doc.date})`);
    res.json({ message: "Holiday deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHolidays, createHoliday, deleteHoliday };
