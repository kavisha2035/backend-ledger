const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const allowedOrigins = [
    "http://localhost:5173",
    "https://backend-ledger-ten.vercel.app",
    "https://backend-ledger-git-main-kavisha2035-7094s-projects.vercel.app"
];

if (process.env.CLIENT_URL) {
    const urls = process.env.CLIENT_URL.split(",").map(url => url.trim());
    urls.forEach(url => {
        if (url && !allowedOrigins.includes(url)) {
            allowedOrigins.push(url);
        }
    });
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, postman, curl)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.includes(origin);
        const isVercelPreview = origin.startsWith("https://backend-ledger-") && origin.endsWith(".vercel.app");

        if (isAllowed || isVercelPreview) {
            return callback(null, true);
        } else {
            return callback(new Error("CORS policy mismatch"), false);
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 1. Import all route files
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");
const auditRoutes = require("./routes/audit.routes");
const reconciliationRoutes = require("./routes/reconciliation.routes");

// 2. Connect routers to Express paths
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/admin", reconciliationRoutes);

module.exports = app;
