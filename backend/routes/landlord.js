const router = require("express").Router();
const { authorizeRoles, verifyToken } = require("../middleware/auth");
const {
  createFinanceRecord,
  createTenant,
  deleteFinanceRecord,
  deleteTenant,
  getFinanceRecords,
  getLandlordOverview,
  getTenants,
  updateFinanceRecord,
  updateTenant
} = require("../controllers/landlordController");

router.use(verifyToken, authorizeRoles("landlord", "admin"));

router.get("/overview", getLandlordOverview);
router.get("/tenants", getTenants);
router.post("/tenants", createTenant);
router.put("/tenants/:id", updateTenant);
router.delete("/tenants/:id", deleteTenant);
router.get("/finance", getFinanceRecords);
router.post("/finance", createFinanceRecord);
router.put("/finance/:id", updateFinanceRecord);
router.delete("/finance/:id", deleteFinanceRecord);

module.exports = router;
