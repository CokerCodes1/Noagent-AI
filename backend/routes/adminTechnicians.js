const router = require("express").Router();
const { authorizeRoles, verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  createAdminTechnician,
  deleteAdminTechnician,
  getAdminTechnicians,
  updateAdminTechnician
} = require("../controllers/technicianController");

router.get("/", verifyToken, authorizeRoles("admin"), getAdminTechnicians);
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 }
  ]),
  createAdminTechnician
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 }
  ]),
  updateAdminTechnician
);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteAdminTechnician);

module.exports = router;
