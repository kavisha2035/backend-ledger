const prisma = require("../config/prisma");
const { pool } = require("../config/prisma");
const { Prisma } = require("@prisma/client");
const emailService = require("../services/email.service");
const { executeSerializableTransaction } = require("../services/dbTransaction.service");
const { logAction, AuditActions, extractRequestInfo } = require("../services/audit.service");

// Helper: compute balance from ledger via Prisma groupBy (fallback if cache miss)
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
// POST /api/transactions — Create standard user-to-user transaction
//
// Production-grade implementation using:
//   ★ SERIALIZABLE isolation level
//   ★ SELECT ... FOR UPDATE (row-level locking on BalanceCache)
//   ★ Optimistic locking (version check)
//   ★ Automatic retry on serialization conflicts
//   ★ Balance cache update (O(1) reads instead of O(n) aggregation)
//   ★ Audit logging
// ─────────────────────────────────────────────────────────────────────────────────
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey, description } = req.body;
    const reqInfo = extractRequestInfo(req);

    try {
        // 1. Idempotency check (outside the serializable TX for performance)
        const existing = await prisma.transaction.findUnique({
            where: { idempotencyKey }
        });

        if (existing) {
            if (existing.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: existing
                });
            }
            if (existing.status === "PENDING") {
                return res.status(200).json({ message: "Transaction is still processing" });
            }
            if (existing.status === "FAILED") {
                return res.status(500).json({ message: "Transaction processing failed previously, please retry" });
            }
            if (existing.status === "REVERSED") {
                return res.status(500).json({ message: "Transaction was reversed, please retry" });
            }
        }

        // 2. Validate accounts (outside serializable TX)
        const [fromUserAccount, toUserAccount] = await Promise.all([
            prisma.account.findUnique({ where: { id: fromAccount } }),
            prisma.account.findUnique({ where: { id: toAccount } })
        ]);

        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({ message: "Invalid fromAccount or toAccount" });
        }

        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
            });
        }

        // Log transfer initiation
        logAction(req.user.id, AuditActions.TRANSFER_INITIATED, {
            entity: "Transaction",
            metadata: { fromAccount, toAccount, amount, idempotencyKey },
            ...reqInfo,
        });

        // 3. SERIALIZABLE TRANSACTION with ROW-LEVEL LOCKING
        //    Uses raw pg pool for true SELECT ... FOR UPDATE support
        const completedTx = await executeSerializableTransaction(pool, async (client) => {
            // ── Lock both BalanceCache rows with SELECT ... FOR UPDATE ──
            // This prevents concurrent transactions from reading stale balances.
            // Always lock in deterministic order (smaller ID first) to prevent deadlocks.
            const lockOrder = [fromAccount, toAccount].sort();
            const lockResult = await client.query(
                `SELECT "accountId", "cachedBalance", "version"
                 FROM "BalanceCache"
                 WHERE "accountId" = ANY($1)
                 ORDER BY "accountId"
                 FOR UPDATE`,
                [lockOrder]
            );

            // Build a map of locked balances
            const balanceMap = {};
            for (const row of lockResult.rows) {
                balanceMap[row.accountId] = {
                    balance: parseFloat(row.cachedBalance),
                    version: row.version,
                };
            }

            // If balance cache doesn't exist for an account, fall back to ledger
            let senderBalance;
            if (balanceMap[fromAccount]) {
                senderBalance = balanceMap[fromAccount].balance;
            } else {
                senderBalance = await getBalanceFromLedger(fromAccount);
            }

            // ── Balance check (under lock — no race condition possible) ──
            if (senderBalance < amount) {
                throw Object.assign(
                    new Error(`Insufficient balance. Current balance is ${senderBalance}. Requested amount is ${amount}`),
                    { isInsufficientBalance: true }
                );
            }

            // ── Create Transaction record ──
            const txResult = await client.query(
                `INSERT INTO "Transaction" ("id", "fromAccountId", "toAccountId", "amount", "status", "idempotencyKey", "description", "createdAt", "updatedAt")
                 VALUES (gen_random_uuid(), $1, $2, $3, 'PENDING', $4, $5, NOW(), NOW())
                 RETURNING *`,
                [fromAccount, toAccount, amount, idempotencyKey, description || "Funds Transfer"]
            );
            const txRecord = txResult.rows[0];

            // ── Create Ledger Entries (DEBIT + CREDIT) ──
            await client.query(
                `INSERT INTO "LedgerEntry" ("id", "accountId", "transactionId", "amount", "type", "createdAt")
                 VALUES
                    (gen_random_uuid(), $1, $3, $4, 'DEBIT', NOW()),
                    (gen_random_uuid(), $2, $3, $4, 'CREDIT', NOW())`,
                [fromAccount, toAccount, txRecord.id, amount]
            );

            // ── Update BalanceCache with optimistic locking (version increment) ──
            if (balanceMap[fromAccount]) {
                const updateSender = await client.query(
                    `UPDATE "BalanceCache"
                     SET "cachedBalance" = "cachedBalance" - $1, "version" = "version" + 1, "updatedAt" = NOW()
                     WHERE "accountId" = $2 AND "version" = $3`,
                    [amount, fromAccount, balanceMap[fromAccount].version]
                );
                if (updateSender.rowCount === 0) {
                    throw Object.assign(new Error("Optimistic lock conflict on sender balance"), { code: "40001" });
                }
            }

            if (balanceMap[toAccount]) {
                const updateReceiver = await client.query(
                    `UPDATE "BalanceCache"
                     SET "cachedBalance" = "cachedBalance" + $1, "version" = "version" + 1, "updatedAt" = NOW()
                     WHERE "accountId" = $2 AND "version" = $3`,
                    [amount, toAccount, balanceMap[toAccount].version]
                );
                if (updateReceiver.rowCount === 0) {
                    throw Object.assign(new Error("Optimistic lock conflict on receiver balance"), { code: "40001" });
                }
            }

            // ── Mark Transaction as COMPLETED ──
            const completedResult = await client.query(
                `UPDATE "Transaction" SET "status" = 'COMPLETED', "updatedAt" = NOW()
                 WHERE "id" = $1 RETURNING *`,
                [txRecord.id]
            );

            return completedResult.rows[0];
        });

        // Audit: transfer completed
        logAction(req.user.id, AuditActions.TRANSFER_COMPLETED, {
            entity: "Transaction",
            entityId: completedTx.id,
            metadata: { fromAccount, toAccount, amount },
            ...reqInfo,
        });

        // Send confirmation email asynchronously
        emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount).catch(err => {
            console.error("Failed to send transaction email:", err);
        });

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: completedTx
        });
    } catch (error) {
        // Handle insufficient balance gracefully (not a 500 error)
        if (error.isInsufficientBalance) {
            return res.status(400).json({ message: error.message });
        }

        // Audit: transfer failed
        logAction(req.user.id, AuditActions.TRANSFER_FAILED, {
            entity: "Transaction",
            metadata: { fromAccount, toAccount, amount, error: error.message },
            ...reqInfo,
        });

        emailService.sendTransactionFailureEmail(req.user.email, req.user.name, amount, toAccount).catch(err => {
            console.error("Failed to send transaction failure email:", err);
        });

        return res.status(500).json({ message: "Transaction failed", error: error.message });
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// POST /api/transactions/system/initial-funds — Seed account from system user
//
// Uses the same serializable transaction pattern for consistency.
// ─────────────────────────────────────────────────────────────────────────────────
async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey, description } = req.body;
    const reqInfo = extractRequestInfo(req);

    try {
        const toUserAccount = await prisma.account.findUnique({
            where: { id: toAccount }
        });

        if (!toUserAccount) {
            return res.status(400).json({ message: "Invalid account" });
        }

        const fromUserAccount = await prisma.account.findFirst({
            where: {
                systemUser: true,
                userId: req.user.id
            }
        });

        if (!fromUserAccount) {
            return res.status(400).json({ message: "System user account not found" });
        }

        const completedTx = await executeSerializableTransaction(pool, async (client) => {
            // Lock balance cache rows
            const lockOrder = [fromUserAccount.id, toAccount].sort();
            await client.query(
                `SELECT "accountId" FROM "BalanceCache"
                 WHERE "accountId" = ANY($1)
                 ORDER BY "accountId"
                 FOR UPDATE`,
                [lockOrder]
            );

            // Create transaction
            const txResult = await client.query(
                `INSERT INTO "Transaction" ("id", "fromAccountId", "toAccountId", "amount", "status", "idempotencyKey", "description", "createdAt", "updatedAt")
                 VALUES (gen_random_uuid(), $1, $2, $3, 'PENDING', $4, $5, NOW(), NOW())
                 RETURNING *`,
                [fromUserAccount.id, toAccount, amount, idempotencyKey, description || "Initial Seed Funds"]
            );
            const txRecord = txResult.rows[0];

            // Create ledger entries
            await client.query(
                `INSERT INTO "LedgerEntry" ("id", "accountId", "transactionId", "amount", "type", "createdAt")
                 VALUES
                    (gen_random_uuid(), $1, $3, $4, 'DEBIT', NOW()),
                    (gen_random_uuid(), $2, $3, $4, 'CREDIT', NOW())`,
                [fromUserAccount.id, toAccount, txRecord.id, amount]
            );

            // Update balance caches
            await client.query(
                `UPDATE "BalanceCache"
                 SET "cachedBalance" = "cachedBalance" - $1, "version" = "version" + 1, "updatedAt" = NOW()
                 WHERE "accountId" = $2`,
                [amount, fromUserAccount.id]
            ).catch(() => {}); // System account may not have a cache

            await client.query(
                `UPDATE "BalanceCache"
                 SET "cachedBalance" = "cachedBalance" + $1, "version" = "version" + 1, "updatedAt" = NOW()
                 WHERE "accountId" = $2`,
                [amount, toAccount]
            ).catch(() => {});

            // Mark completed
            const completedResult = await client.query(
                `UPDATE "Transaction" SET "status" = 'COMPLETED', "updatedAt" = NOW()
                 WHERE "id" = $1 RETURNING *`,
                [txRecord.id]
            );

            return completedResult.rows[0];
        });

        // Audit log
        logAction(req.user.id, AuditActions.INITIAL_FUNDS_COMPLETED, {
            entity: "Transaction",
            entityId: completedTx.id,
            metadata: { toAccount, amount, fromSystemAccount: fromUserAccount.id },
            ...reqInfo,
        });

        return res.status(201).json({
            message: "Initial fund transaction completed successfully",
            transaction: completedTx
        });
    } catch (error) {
        logAction(req.user.id, AuditActions.INITIAL_FUNDS_FAILED, {
            entity: "Transaction",
            metadata: { toAccount, amount, error: error.message },
            ...reqInfo,
        });

        return res.status(500).json({ message: "Initial transaction failed", error: error.message });
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// GET /api/transactions — Paginated, filtered and searchable history
//
// Now filters out soft-deleted transactions (deletedAt IS NULL).
// ─────────────────────────────────────────────────────────────────────────────────
async function getTransactionsController(req, res) {
    try {
        const { accountId, page = 1, limit = 20, status, startDate, endDate, minAmount, maxAmount, search, type } = req.query;

        if (!accountId) {
            return res.status(400).json({ message: "accountId query parameter is required" });
        }

        // Validate account ownership
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId: req.user.id }
        });
        if (!account) {
            return res.status(404).json({ message: "Account not found or access denied" });
        }

        // Build Prisma where clause — exclude soft-deleted transactions
        const where = { deletedAt: null };

        // Filter by transaction type relative to queried account
        if (type === "DEBIT") {
            where.fromAccountId = accountId;
        } else if (type === "CREDIT") {
            where.toAccountId = accountId;
        } else {
            where.OR = [
                { fromAccountId: accountId },
                { toAccountId: accountId }
            ];
        }

        if (status) {
            where.status = status;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        if (minAmount || maxAmount) {
            where.amount = {};
            if (minAmount) where.amount.gte = Number(minAmount);
            if (maxAmount) where.amount.lte = Number(maxAmount);
        }

        if (search) {
            where.description = { contains: search, mode: "insensitive" };
        }

        const limitInt = parseInt(limit);
        const pageInt = parseInt(page);
        const skip = (pageInt - 1) * limitInt;

        const [rawTransactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limitInt
            }),
            prisma.transaction.count({ where })
        ]);

        // Map and append DEBIT/CREDIT context relative to queried account
        const transactions = rawTransactions.map(tx => {
            const isDebit = tx.fromAccountId === accountId;
            return {
                _id: tx.id,
                fromAccount: tx.fromAccountId,
                toAccount: tx.toAccountId,
                amount: Number(tx.amount),
                status: tx.status,
                idempotencyKey: tx.idempotencyKey,
                description: tx.description || (isDebit ? "Funds Transfer" : "Deposit"),
                createdAt: tx.createdAt,
                type: isDebit ? "DEBIT" : "CREDIT"
            };
        });

        res.status(200).json({
            transactions,
            pagination: {
                total,
                page: pageInt,
                limit: limitInt,
                totalPages: Math.ceil(total / limitInt)
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch transactions", error: error.message });
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// GET /api/transactions/export — Generate and download CSV statement
//
// Excludes soft-deleted transactions.
// ─────────────────────────────────────────────────────────────────────────────────
async function exportStatementController(req, res) {
    try {
        const { accountId, from, to } = req.query;
        if (!accountId) {
            return res.status(400).json({ message: "accountId query parameter is required" });
        }

        const account = await prisma.account.findFirst({
            where: { id: accountId, userId: req.user.id }
        });
        if (!account) {
            return res.status(404).json({ message: "Account not found or access denied" });
        }

        const where = {
            deletedAt: null, // Exclude soft-deleted
            OR: [
                { fromAccountId: accountId },
                { toAccountId: accountId }
            ]
        };

        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { createdAt: "desc" }
        });

        const csvHeaders = "Transaction ID,Date,Description,Type,Amount,Status,From Account,To Account\n";
        const csvRows = transactions.map(tx => {
            const isDebit = tx.fromAccountId === accountId;
            const typeStr = isDebit ? "DEBIT" : "CREDIT";
            const dateStr = new Date(tx.createdAt).toISOString();
            const cleanDesc = (tx.description || "Funds Transfer").replace(/"/g, '""');
            return `"${tx.id}","${dateStr}","${cleanDesc}","${typeStr}",${tx.amount},"${tx.status}","${tx.fromAccountId}","${tx.toAccountId}"`;
        }).join("\n");

        const csvData = csvHeaders + csvRows;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=statement_${accountId}.csv`);
        return res.status(200).send(csvData);
    } catch (error) {
        res.status(500).json({ message: "Failed to export statement", error: error.message });
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// DELETE /api/transactions/:id — Soft delete a transaction
//
// Banks never permanently delete financial records.
// Sets deletedAt = current timestamp instead of actually removing the row.
// ─────────────────────────────────────────────────────────────────────────────────
async function softDeleteTransaction(req, res) {
    const { id } = req.params;
    const reqInfo = extractRequestInfo(req);

    try {
        // Verify the transaction exists and belongs to the user
        const transaction = await prisma.transaction.findFirst({
            where: {
                id,
                deletedAt: null, // Not already soft-deleted
                OR: [
                    { fromAccount: { userId: req.user.id } },
                    { toAccount: { userId: req.user.id } },
                ]
            }
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found or already deleted" });
        }

        const updated = await prisma.transaction.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        // Audit log
        logAction(req.user.id, AuditActions.TRANSACTION_SOFT_DELETED, {
            entity: "Transaction",
            entityId: id,
            metadata: {
                amount: Number(transaction.amount),
                fromAccount: transaction.fromAccountId,
                toAccount: transaction.toAccountId,
                status: transaction.status,
            },
            ...reqInfo,
        });

        return res.status(200).json({
            message: "Transaction soft-deleted successfully",
            transaction: updated
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete transaction",
            error: error.message
        });
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getTransactionsController,
    exportStatementController,
    softDeleteTransaction,
};
