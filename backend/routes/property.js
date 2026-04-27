const router = require("express").Router();
const {
  createProperty,
  getMyProperties,
  getProperties,
  markRented,
  updatePropertyStatus
} = require("../controllers/propertyController");
const { authorizeRoles, optionalAuth, verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/", optionalAuth, getProperties);
router.get("/mine", verifyToken, authorizeRoles("landlord", "admin"), getMyProperties);
router.post(
  "/",
  verifyToken,
  authorizeRoles("landlord", "admin"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 }
  ]),
  createProperty
);
router.put("/:id/rented", verifyToken, authorizeRoles("landlord", "admin"), markRented);
router.put("/:id/status", verifyToken, authorizeRoles("landlord", "admin"), updatePropertyStatus);

module.exports = router;
