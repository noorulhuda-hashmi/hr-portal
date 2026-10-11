const router = require("express").Router();
const c = require("../controllers/documentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin", "hr"));

router.get("/:id/download", c.downloadAny);
router.delete("/:id", c.deleteAny);

module.exports = router;
