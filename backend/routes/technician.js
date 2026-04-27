const router = require("express").Router();
const { authorizeRoles, optionalAuth, verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getMarketplaceTechnicians,
  getMyTechnicianDashboard,
  getMyTechnicianProfile,
  recordTechnicianContact,
  updateMyTechnicianProfile
} = require("../controllers/technicianController");

router.get("/", optionalAuth, getMarketplaceTechnicians);
router.post("/:id/contact", verifyToken, authorizeRoles("admin", "landlord", "renter"), recordTechnicianContact);
router.get("/me/dashboard", verifyToken, authorizeRoles("technician"), getMyTechnicianDashboard);
router.get("/me/profile", verifyToken, authorizeRoles("technician"), getMyTechnicianProfile);
router.put(
  "/me/profile",
  verifyToken,
  authorizeRoles("technician"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 }
  ]),
  updateMyTechnicianProfile
);

module.exports = router;
