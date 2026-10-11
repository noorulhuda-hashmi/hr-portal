const ActivityLog = require("../models/ActivityLog");

// ?page=1 (20 entries per page), sab se naya pehle
const getActivity = async (req, res, next) => {
  try {
    const limit = 20;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const [items, total] = await Promise.all([
      ActivityLog.find()
        .sort("-createdAt")
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(),
    ]);
    res.json({ page, pages: Math.max(Math.ceil(total / limit), 1), total, items });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivity };
