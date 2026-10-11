const router = require("express").Router();
const c = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin", "hr"));

router.get("/attendance", c.attendanceReport);

module.exports = router;
