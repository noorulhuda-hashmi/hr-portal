const router = require("express").Router();
const c = require("../controllers/payrollController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin", "hr"));

router.get("/", c.getPayroll);
router.post("/generate", c.generatePayroll);
router.get("/:id", c.getPayslip);
router.put("/:id", c.updatePayslip);
router.post("/:id/pay", c.markPaid);
router.delete("/:id", c.deletePayslip);

module.exports = router;
