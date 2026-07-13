const { reconcileAllBalances } = require("../services/reconciliation.service");

/**
 * POST /api/admin/reconcile
 * Trigger a reconciliation run comparing cached balances against ledger truth.
 * System user / admin only.
 *
 * Body params:
 *   - autoFix (boolean, default: false) — If true, auto-correct mismatched caches
 */
async function runReconciliation(req, res) {
    try {
        const autoFix = req.body.autoFix === true;
        const report = await reconcileAllBalances(req.user.id, autoFix);

        const statusCode = report.mismatchCount > 0 ? 200 : 200;
        res.status(statusCode).json({
            message: report.mismatchCount > 0
                ? `Reconciliation complete. Found ${report.mismatchCount} mismatch(es).`
                : "Reconciliation complete. All balances are consistent.",
            report,
        });
    } catch (error) {
        res.status(500).json({
            message: "Reconciliation failed",
            error: error.message,
        });
    }
}

module.exports = { runReconciliation };
