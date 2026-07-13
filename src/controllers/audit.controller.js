const prisma = require("../config/prisma");

/**
 * GET /api/audit-logs
 * Paginated, filterable audit log viewer (system user / admin only).
 *
 * Query params:
 *   - page     (default: 1)
 *   - limit    (default: 50)
 *   - userId   (filter by acting user)
 *   - action   (filter by action type, e.g., "USER_LOGIN")
 *   - entity   (filter by entity type, e.g., "Transaction")
 *   - entityId (filter by specific entity)
 *   - startDate / endDate (date range filter)
 */
async function getAuditLogs(req, res) {
    try {
        const {
            page = 1,
            limit = 50,
            userId,
            action,
            entity,
            entityId,
            startDate,
            endDate
        } = req.query;

        const where = {};

        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (entityId) where.entityId = entityId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const limitInt = parseInt(limit);
        const pageInt = parseInt(page);
        const skip = (pageInt - 1) * limitInt;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limitInt,
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.status(200).json({
            auditLogs: logs,
            pagination: {
                total,
                page: pageInt,
                limit: limitInt,
                totalPages: Math.ceil(total / limitInt),
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch audit logs",
            error: error.message,
        });
    }
}

module.exports = { getAuditLogs };
