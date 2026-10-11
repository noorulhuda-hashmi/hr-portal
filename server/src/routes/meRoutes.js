const router = require("express").Router();
const c = require("../controllers/meController");
const { protect } = require("../middleware/authMiddleware");
const docs = require("../controllers/documentController");
const rawBody = require("../middleware/rawBody");

// Sirf wo user jis ka login kisi employee record se linked ho
const linkedEmployee = (req, res, next) => {
  if (!req.user.employee) {
    res.status(403);
    return next(new Error("Your login is not linked to an employee record"));
  }
  req.employeeId = req.user.employee;
  next();
};

router.use(protect, linkedEmployee);

router.get("/dashboard", c.getDashboard);
router.get("/leave-balance", c.getLeaveBalance);
router.post("/checkin", c.checkIn);
router.post("/checkout", c.checkOut);
router.get("/documents", docs.listMine);
router.post("/documents", rawBody, docs.uploadMine);
router.get("/documents/:id/download", docs.downloadMine);
router.delete("/documents/:id", docs.deleteMine);
router.get("/payslips", c.getMyPayslips);
router.get("/payslips/:id", c.getMyPayslip);
router.get("/profile", c.getProfile);
router.get("/attendance", c.getMyAttendance);
router.get("/leaves", c.getMyLeaves);
router.post("/leaves", c.applyLeave);
router.delete("/leaves/:id", c.cancelLeave);

module.exports = router;
