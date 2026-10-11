const router = require("express").Router();
const { getStats } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/stats", authorize("admin", "hr"), getStats);

module.exports = router;
