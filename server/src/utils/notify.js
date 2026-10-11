const Notification = require("../models/Notification");
const User = require("../models/User");

const send = async (userIds, message, link) => {
  if (!userIds.length) return;
  await Notification.insertMany(userIds.map((user) => ({ user, message: message.slice(0, 200), link })));
};

// Teeno helper: error aaye to sirf console mein likhte hain, request fail nahi hoti
const safe = (promise) => promise.catch((err) => console.error("Notification failed:", err.message));

const notifyHR = (message, link) =>
  safe(
    User.find({ role: { $in: ["admin", "hr"] } })
      .select("_id")
      .then((users) => send(users.map((u) => u._id), message, link))
  );

const notifyEmployee = (employeeId, message, link) =>
  safe(
    User.find({ employee: employeeId })
      .select("_id")
      .then((users) => send(users.map((u) => u._id), message, link))
  );

module.exports = { notifyHR, notifyEmployee };
