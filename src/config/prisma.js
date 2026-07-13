const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"]
});

// Export both Prisma client and the raw pg pool.
// The raw pool is needed for SELECT ... FOR UPDATE with SERIALIZABLE isolation,
// which Prisma's driver adapter does not support natively.
module.exports = prisma;
module.exports.pool = pool;
