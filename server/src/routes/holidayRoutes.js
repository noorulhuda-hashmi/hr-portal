const router = require("express").Router();
const c = require("../controllers/holidayController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", c.getHolidays); // har logged-in user dekh sakta hai
router.post("/", authorize("admin", "hr"), c.createHoliday);
router.delete("/:id", authorize("admin", "hr"), c.deleteHoliday);

module.exports = router;
