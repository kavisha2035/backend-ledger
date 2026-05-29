const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());

// 1. Import all of your route files
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes"); //  Added this missing import

// 2. Connect your routers to Express paths
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter); //  Fixed typo: Added missing leading slash "/"
app.use("/api/transactions", transactionRoutes); //  Added this missing line to fix the 404!

module.exports = app;
