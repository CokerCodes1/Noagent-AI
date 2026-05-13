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
const { createRateLimiter } = require("../middleware/rateLimit");
const upload = require("../middleware/upload");

const signupRateLimit = createRateLimiter({
  max: 8,
  message: "Too many signup attempts. Please wait a bit before trying again."
});
const loginRateLimit = createRateLimiter({
  max: 12,
  message: "Too many login attempts. Please try again shortly."
});
const passwordResetRateLimit = createRateLimiter({
  max: 6,
  message: "Too many password reset requests. Please wait before trying again."
});

router.post(
  "/signup",
  signupRateLimit,
  upload.documentUpload.single("verificationDocument"),
  signup
);
router.post("/login", loginRateLimit, login);
router.post("/forgot-password", passwordResetRateLimit, requestPasswordReset);
router.post("/reset-password", passwordResetRateLimit, resetPassword);
router.post("/google", googleLogin);
router.get("/me", verifyToken, getCurrentUser);
router.put("/me", verifyToken, upload.single("avatar"), updateCurrentUser);
router.put("/change-password", verifyToken, changePassword);

module.exports = router;
