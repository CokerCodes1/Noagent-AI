const router = require("express").Router();
const {
  googleLogin,
  login,
  requestPasswordReset,
  resetPassword,
  signup
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/google", googleLogin);

module.exports = router;
