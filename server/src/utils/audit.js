const ActivityLog = require("../models/ActivityLog");

// Log likhna kabhi asli kaam ko kharab na kare, is liye error chup-chaap nigal lete hain
const audit = (req, action, target = "") =>
  ActivityLog.create({
    actor: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action,
    target: String(target).slice(0, 200),
  }).catch((err) => console.error("Audit log failed:", err.message));

module.exports = audit;
