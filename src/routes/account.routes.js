const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");
const validate = require("../middleware/validation.middleware");
const { accountSchema } = require("../middleware/schemas");

const router = express.Router();

// POST /api/accounts
router.post(
    "/",
    authMiddleware.authMiddleware,
    validate(accountSchema),
    accountController.createAccountController
);

// GET /api/accounts
router.get(
    "/",
    authMiddleware.authMiddleware,
    accountController.getAllAccountsController
);

// GET /api/accounts/balance/:accountId
router.get(
    "/balance/:accountId",
    authMiddleware.authMiddleware,
    accountController.getAccountBalanceController
);

module.exports = router;