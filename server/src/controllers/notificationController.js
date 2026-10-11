const Notification = require("../models/Notification");

const getMine = async (req, res, next) => {
  try {
    const [items, unread] = await Promise.all([
      Notification.find({ user: req.user._id }).sort("-createdAt").limit(30),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.json({ unread, items });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
    res.json({ message: "Marked as read" });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: "All marked as read" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMine, markRead, markAllRead };
