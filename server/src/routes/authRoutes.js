const router = require("express").Router();
const { register, login, me, changePassword } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/security");

// Register ab sirf admin kar sakta hai (pehle koi bhi admin ban sakta tha)
router.post("/register", protect, authorize("admin"), register);
router.post("/login", loginLimiter, login);
router.get("/me", protect, me);
router.put("/password", protect, changePassword);

module.exports = router;
