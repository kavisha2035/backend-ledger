const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const reconciliationController = require("../controllers/reconciliation.controller");

const reconciliationRoutes = Router();

// POST /api/admin/reconcile — Trigger balance reconciliation (system user only)
reconciliationRoutes.post(
    "/reconcile",
    authMiddleware.authSystemUserMiddleware,
    reconciliationController.runReconciliation
);

module.exports = reconciliationRoutes;
