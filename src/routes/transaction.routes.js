const {Router}=require("express")
const authMiddleware=require("../middleware/auth.middleware")
const transactionController=require("../controllers/transaction.controller")


const transactionRoutes=Router();

//create a new transaction
// POST /api/transactions
transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)

//-POST api/transactions/system/initial-funds
// cerate initial funds transaction from system user 

transactionRoutes.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction)
module.exports=transactionRoutes;