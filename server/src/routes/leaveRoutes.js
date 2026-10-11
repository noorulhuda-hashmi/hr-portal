const router = require("express").Router();
const c = require("../controllers/leaveController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin", "hr"));

router.get("/", c.getLeaves);
router.post("/", c.createLeave);
router.patch("/:id/review", c.reviewLeave);
router.delete("/:id", c.deleteLeave);

module.exports = router;
