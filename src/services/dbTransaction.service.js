/**
 * Serializable Transaction Executor with Automatic Retry
 *
 * Uses raw pg pool (not Prisma) to enable:
 * - SERIALIZABLE isolation level (strongest consistency)
 * - SELECT ... FOR UPDATE (row-level locking)
 * - Automatic retry on serialization failures (PostgreSQL error code 40001)
 *
 * Production banking systems use this pattern to prevent:
 * - Double spending
 * - Phantom reads
 * - Write skew anomalies
 */

/**
 * Sleep helper for exponential backoff between retries.
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a callback inside a SERIALIZABLE transaction with automatic retry.
 *
 * @param {import('pg').Pool} pool       - The raw pg pool
 * @param {function}          callback   - Async function receiving the pg client: async (client) => result
 * @param {number}            maxRetries - Maximum retry attempts on serialization failure (default: 3)
 * @returns {Promise<*>} The result of the callback
 * @throws {Error} If all retries are exhausted or a non-retryable error occurs
 */
async function executeSerializableTransaction(pool, callback, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE");
            const result = await callback(client);
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK").catch(() => {});

            // PostgreSQL serialization failure code = 40001
            // PostgreSQL deadlock detected code = 40P01
            const isRetryable = error.code === "40001" || error.code === "40P01";

            if (isRetryable && attempt < maxRetries) {
                const backoffMs = Math.pow(2, attempt) * 50 + Math.random() * 50;
                console.warn(
                    `[SerializableTx] Serialization conflict (attempt ${attempt}/${maxRetries}), ` +
                    `retrying in ${Math.round(backoffMs)}ms...`
                );
                await sleep(backoffMs);
                continue;
            }

            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = { executeSerializableTransaction };
