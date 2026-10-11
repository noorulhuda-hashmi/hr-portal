const router = require("express").Router();
const c = require("../controllers/departmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", c.getDepartments);
router.post("/", authorize("admin", "hr"), c.createDepartment);
router.put("/:id", authorize("admin", "hr"), c.updateDepartment);
router.delete("/:id", authorize("admin"), c.deleteDepartment);

module.exports = router;
