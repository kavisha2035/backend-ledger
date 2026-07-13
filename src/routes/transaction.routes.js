const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");
const validate = require("../middleware/validation.middleware");
const { transactionSchema, initialFundsSchema } = require("../middleware/schemas");

const transactionRoutes = Router();

// GET /api/transactions (Fetch paginated, filtered transaction history)
transactionRoutes.get(
    "/",
    authMiddleware.authMiddleware,
    transactionController.getTransactionsController
);

// GET /api/transactions/export (Download CSV ledger statement)
transactionRoutes.get(
    "/export",
    authMiddleware.authMiddleware,
    transactionController.exportStatementController
);

// POST /api/transactions (Initiate transaction with Zod validation)
transactionRoutes.post(
    "/",
    authMiddleware.authMiddleware,
    validate(transactionSchema),
    transactionController.createTransaction
);

// POST /api/transactions/system/initial-funds (Seed account with Zod validation)
transactionRoutes.post(
    "/system/initial-funds",
    authMiddleware.authSystemUserMiddleware,
    validate(initialFundsSchema),
    transactionController.createInitialFundsTransaction
);

// DELETE /api/transactions/:id (Soft delete — sets deletedAt timestamp)
transactionRoutes.delete(
    "/:id",
    authMiddleware.authMiddleware,
    transactionController.softDeleteTransaction
);

module.exports = transactionRoutes;