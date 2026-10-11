const router = require("express").Router();
const c = require("../controllers/employeeController");
const acc = require("../controllers/accountController");
const docs = require("../controllers/documentController");
const rawBody = require("../middleware/rawBody");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", authorize("admin", "hr"), c.getEmployees);
router.post("/", authorize("admin", "hr"), c.createEmployee);
router.get("/:id/documents", authorize("admin", "hr"), docs.listForEmployee);
router.post("/:id/documents", authorize("admin", "hr"), rawBody, docs.uploadForEmployee);
router.get("/:id/account", authorize("admin", "hr"), acc.getAccount);
router.post("/:id/account", authorize("admin", "hr"), acc.createAccount);
router.put("/:id/account", authorize("admin", "hr"), acc.resetPassword);
router.get("/:id", authorize("admin", "hr"), c.getEmployee);
router.put("/:id", authorize("admin", "hr"), c.updateEmployee);
router.delete("/:id", authorize("admin"), c.deleteEmployee);

module.exports = router;
