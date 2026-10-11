const router = require("express").Router();
const c = require("../controllers/activityController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin"), c.getActivity);

module.exports = router;
