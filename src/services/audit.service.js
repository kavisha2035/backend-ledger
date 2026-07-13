const prisma = require("../config/prisma");

// ─── Audit Action Constants ─────────────────────────────────────────────────────
const AuditActions = {
    // Auth
    USER_REGISTERED: "USER_REGISTERED",
    USER_LOGIN: "USER_LOGIN",
    USER_LOGOUT: "USER_LOGOUT",
    TOKEN_REFRESHED: "TOKEN_REFRESHED",
    TOKEN_REUSE_DETECTED: "TOKEN_REUSE_DETECTED",

    // Account
    ACCOUNT_CREATED: "ACCOUNT_CREATED",

    // Transaction
    TRANSFER_INITIATED: "TRANSFER_INITIATED",
    TRANSFER_COMPLETED: "TRANSFER_COMPLETED",
    TRANSFER_FAILED: "TRANSFER_FAILED",
    INITIAL_FUNDS_COMPLETED: "INITIAL_FUNDS_COMPLETED",
    INITIAL_FUNDS_FAILED: "INITIAL_FUNDS_FAILED",
    TRANSACTION_SOFT_DELETED: "TRANSACTION_SOFT_DELETED",

    // Reconciliation
    RECONCILIATION_RUN: "RECONCILIATION_RUN",
    RECONCILIATION_MISMATCH: "RECONCILIATION_MISMATCH",
};

/**
 * Fire-and-forget audit log insertion.
 * Never throws — failures are logged to console but never block the request path.
 *
 * @param {string|null} userId    - ID of the acting user (null for system actions)
 * @param {string}      action    - One of AuditActions constants
 * @param {Object}      options
 * @param {string}      [options.entity]    - Entity type (e.g., "Transaction", "Account")
 * @param {string}      [options.entityId]  - ID of the affected entity
 * @param {Object}      [options.metadata]  - Additional context (amount, old/new values, etc.)
 * @param {string}      [options.ip]        - Client IP address
 * @param {string}      [options.userAgent] - Client User-Agent string
 */
function logAction(userId, action, options = {}) {
    const { entity, entityId, metadata, ip, userAgent } = options;

    // Fire-and-forget — do NOT await
    prisma.auditLog.create({
        data: {
            userId,
            action,
            entity: entity || null,
            entityId: entityId || null,
            metadata: metadata || null,
            ip: ip || null,
            userAgent: userAgent || null,
        }
    }).catch(err => {
        console.error("[AuditLog] Failed to write audit log:", err.message);
    });
}

/**
 * Extract IP and User-Agent from an Express request object.
 * Useful for passing to logAction.
 */
function extractRequestInfo(req) {
    return {
        ip: req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || null,
        userAgent: req.headers["user-agent"] || null,
    };
}

module.exports = {
    AuditActions,
    logAction,
    extractRequestInfo,
};
