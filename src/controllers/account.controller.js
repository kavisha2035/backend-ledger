const prisma = require("../config/prisma");
const { logAction, AuditActions, extractRequestInfo } = require("../services/audit.service");

// Helper: compute balance from ledger via Prisma groupBy (fallback)
async function getBalanceFromLedger(accountId) {
    const result = await prisma.ledgerEntry.groupBy({
        by: ["type"],
        where: { accountId },
        _sum: { amount: true }
    });

    const credits = result.find(r => r.type === "CREDIT")?._sum.amount || 0;
    const debits = result.find(r => r.type === "DEBIT")?._sum.amount || 0;
    return Number(credits) - Number(debits);
}

// ─────────────────────────────────────────────────────────────────────────────────
// POST /api/accounts — Create a new account
//
// Also creates a BalanceCache row with cachedBalance = 0 for O(1) balance reads.
// ─────────────────────────────────────────────────────────────────────────────────
async function createAccountController(req, res) {
    try {
        const user = req.user;
        const { currency } = req.body;
        const reqInfo = extractRequestInfo(req);

        // Create account + balance cache atomically
        const account = await prisma.$transaction(async (tx) => {
            const newAccount = await tx.account.create({
                data: {
                    userId: user.id,
                    currency: currency || "INR"
                }
            });

            // Initialize balance cache at 0
            await tx.balanceCache.create({
                data: {
                    accountId: newAccount.id,
                    cachedBalance: 0,
                    version: 0,
                }
            });

            return newAccount;
        });

        // Audit log: account created
        logAction(user.id, AuditActions.ACCOUNT_CREATED, {
            entity: "Account",
            entityId: account.id,
            metadata: { currency: account.currency },
            ...reqInfo,
        });

        res.status(201).json({ account });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create account",
            error: error.message
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// GET /api/accounts — Fetch all accounts for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────────
async function getAllAccountsController(req, res) {
    try {
        const accounts = await prisma.account.findMany({
            where: { userId: req.user.id }
        });

        return res.status(200).json({ accounts });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch accounts",
            error: error.message
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// GET /api/accounts/balance/:accountId — Get account balance
//
// Reads from BalanceCache for O(1) performance.
// Falls back to ledger aggregation if cache doesn't exist yet.
// ─────────────────────────────────────────────────────────────────────────────────
async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;
        const account = await prisma.account.findFirst({
            where: {
                id: accountId,
                userId: req.user.id
            }
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        // Try reading from balance cache first (O(1))
        const cache = await prisma.balanceCache.findUnique({
            where: { accountId: account.id }
        });

        let balance;
        let source;

        if (cache) {
            balance = Number(cache.cachedBalance);
            source = "cache";
        } else {
            // Fallback to ledger aggregation (O(n))
            balance = await getBalanceFromLedger(account.id);
            source = "ledger";
        }

        res.status(200).json({
            accountId: account.id,
            balance,
            source, // Tells the consumer whether balance came from cache or ledger
            ...(cache ? {
                cacheVersion: cache.version,
                lastReconciledAt: cache.lastReconciledAt
            } : {})
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to get balance",
            error: error.message
        });
    }
}

module.exports = {
    createAccountController,
    getAllAccountsController,
    getAccountBalanceController
};