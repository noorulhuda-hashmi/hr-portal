const router = require("express").Router();
const c = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin", "hr"));

router.get("/", c.getDaily);
router.post("/", c.markAttendance);
router.delete("/:id", c.deleteAttendance);

module.exports = router;
