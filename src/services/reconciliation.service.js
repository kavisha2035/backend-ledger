const prisma = require("../config/prisma");
const { AuditActions, logAction } = require("./audit.service");

/**
 * Reconciliation Service
 *
 * Compares the cached balance (BalanceCache table) against the true balance
 * derived from the ledger (SUM of CREDITs - SUM of DEBITs).
 *
 * Flow:
 *   Nightly Reconciliation Job
 *          ↓
 *   Compare Cache vs Ledger
 *          ↓
 *   If mismatch → Raise Alert (log + return mismatch details)
 *          ↓
 *   Optionally auto-fix the cache
 */

/**
 * Compute the true balance from the ledger for a given account.
 * This is the source of truth — O(n) aggregation across all ledger entries.
 *
 * @param {string} accountId
 * @returns {Promise<number>}
 */
async function computeLedgerBalance(accountId) {
    const result = await prisma.ledgerEntry.groupBy({
        by: ["type"],
        where: { accountId },
        _sum: { amount: true }
    });

    const credits = result.find(r => r.type === "CREDIT")?._sum.amount || 0;
    const debits = result.find(r => r.type === "DEBIT")?._sum.amount || 0;
    return Number(credits) - Number(debits);
}

/**
 * Reconcile all accounts: compare cached balance vs ledger truth.
 *
 * @param {string|null} triggeredByUserId - User who triggered the reconciliation (for audit)
 * @param {boolean}     autoFix           - If true, automatically fix mismatched caches
 * @returns {Promise<Object>} Reconciliation report
 */
async function reconcileAllBalances(triggeredByUserId = null, autoFix = false) {
    const allCaches = await prisma.balanceCache.findMany({
        include: { account: { select: { id: true, userId: true, status: true } } }
    });

    const mismatches = [];
    let checkedCount = 0;

    for (const cache of allCaches) {
        checkedCount++;
        const ledgerBalance = await computeLedgerBalance(cache.accountId);
        const cachedBalance = Number(cache.cachedBalance);

        if (Math.abs(cachedBalance - ledgerBalance) > 0.001) { // Tolerance for floating point
            const mismatch = {
                accountId: cache.accountId,
                cachedBalance,
                ledgerBalance,
                difference: cachedBalance - ledgerBalance,
                userId: cache.account?.userId,
            };
            mismatches.push(mismatch);

            // Log each mismatch as an audit alert
            logAction(triggeredByUserId, AuditActions.RECONCILIATION_MISMATCH, {
                entity: "BalanceCache",
                entityId: cache.accountId,
                metadata: mismatch,
            });

            if (autoFix) {
                await prisma.balanceCache.update({
                    where: { accountId: cache.accountId },
                    data: {
                        cachedBalance: ledgerBalance,
                        version: { increment: 1 },
                        lastReconciledAt: new Date(),
                    }
                });
            }
        } else {
            // Mark as reconciled even if no mismatch
            await prisma.balanceCache.update({
                where: { accountId: cache.accountId },
                data: { lastReconciledAt: new Date() }
            });
        }
    }

    const report = {
        checkedCount,
        mismatchCount: mismatches.length,
        mismatches,
        autoFixed: autoFix,
        reconciledAt: new Date().toISOString(),
    };

    // Audit the reconciliation run itself
    logAction(triggeredByUserId, AuditActions.RECONCILIATION_RUN, {
        entity: "BalanceCache",
        metadata: {
            checkedCount,
            mismatchCount: mismatches.length,
            autoFixed: autoFix,
        }
    });

    return report;
}

module.exports = {
    computeLedgerBalance,
    reconcileAllBalances,
};
