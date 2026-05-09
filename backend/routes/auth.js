const router = require("express").Router();
const {
  changePassword,
  getCurrentUser,
  googleLogin,
  login,
  requestPasswordReset,
  resetPassword,
  signup,
  updateCurrentUser
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/google", googleLogin);
router.get("/me", verifyToken, getCurrentUser);
router.put("/me", verifyToken, upload.single("avatar"), updateCurrentUser);
router.put("/change-password", verifyToken, changePassword);

module.exports = router;
