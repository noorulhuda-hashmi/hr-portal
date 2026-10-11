const router = require("express").Router();
const c = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", c.getMine);
router.post("/read-all", c.markAllRead);
router.post("/:id/read", c.markRead);

module.exports = router;
