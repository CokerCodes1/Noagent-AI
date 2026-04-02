const router = require("express").Router();
const { googleLogin, login, signup } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);

module.exports = router;
