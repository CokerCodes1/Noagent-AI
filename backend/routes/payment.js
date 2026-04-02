const router = require("express").Router();
const {
  initializePayment,
  verifyPayment
} = require("../controllers/paymentController");
const { authorizeRoles, verifyToken } = require("../middleware/auth");

router.post("/initialize", verifyToken, authorizeRoles("renter", "admin"), initializePayment);
router.get("/verify/:reference", verifyToken, authorizeRoles("renter", "admin"), verifyPayment);

module.exports = router;
