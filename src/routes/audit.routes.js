const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const auditController = require("../controllers/audit.controller");

const auditRoutes = Router();

// GET /api/audit-logs — Paginated, filterable audit log viewer (system user only)
auditRoutes.get(
    "/",
    authMiddleware.authSystemUserMiddleware,
    auditController.getAuditLogs
);

module.exports = auditRoutes;
