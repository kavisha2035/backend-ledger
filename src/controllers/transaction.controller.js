const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

// Validate request 
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotency are required"
        });
    }
    
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    });

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    });

    //  Fixed capitalization of fromUserAccount
    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        });
    }

    // validate idempotency key
    //  Fixed capitalization of isTransactionAlreadyExists
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey,
    });
    
    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            });
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing"
            });
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed previously, please retry"
            });
        }

        if (isTransactionAlreadyExists.status === "RESERVED") {
            return res.status(500).json({
                message: "Transaction was reversed please retry "
            });
        }
    }

    // check account status
    //  Fixed capitalization of fromUserAccount
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        });
    }

    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({ // Added return here to stop execution if balance is low
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        });
    }

    // create transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        //  Fixed typo from transactionalModek to transactionModel
        const transaction = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction[0]._id,
            type: "CREDIT"
        }], { session });

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction[0]._id,
            type: "DEBIT"
        }], { session });

        // When using transactionModel.create with a session array, it returns an array
        const targetTransaction = transaction[0];
        targetTransaction.status = "COMPLETED";
        await targetTransaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Fixed typo from toAccounts to toAccount
        await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);

        return res.status(201).json({
            message: "Transaction completed successfully "
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: "Transaction failed", error: error.message });
    }
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencykey are required"
        });
    }
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    });

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid account "
        });
    }

    const fromUserAccount = await accountModel.findOne({
        systemUser: true,
        user: req.user._id
    });

    console.log("====================================");
console.log("🔍 REAL PROBLEM DEBUG LOG:");
console.log("Token User ID:", req.user ? req.user._id : "NO USER IN TOKEN");
console.log("Found DB Account?:", fromUserAccount ? "YES" : "NO (NULL)");
console.log("====================================");

if (!fromUserAccount) {
    return res.status(400).json({
        message: "Invalid account "
    });
}

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        //  Fixed typo from transactionalModel to transactionModel
        const transaction = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromUserAccount._id,
            amount: amount,
            transaction: transaction[0]._id,
            type: "DEBIT"
        }], { session });

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction[0]._id,
            type: "CREDIT"
        }], { session });

        const targetTransaction = transaction[0];
        targetTransaction.status = "COMPLETED";
        await targetTransaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Initial fund transaction completed successfully "
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: "Initial transaction failed", error: error.message });
    }
}


module.exports = {
    createTransaction,
    createInitialFundsTransaction
};
