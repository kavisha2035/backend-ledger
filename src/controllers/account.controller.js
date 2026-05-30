const accountModel=require("../models/account.model");


async function createAccountController(req,res){
    const user=req.user;
    const account=await accountModel.create({
        user:user._id
    })
    res.status(201).json({
        account
    })
}

async function getAllAccountsController(req, res) {
    try {
        // Find all accounts belonging to the logged-in user
        const accounts = await accountModel.find({ user: req.user._id });
        
        return res.status(200).json({
            accounts: accounts
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch accounts",
            error: error.message
        });
    }
}

async function getAccountBalanceController(req,res){
    const {accountId}=req.params;
    const account=await accountModel.findOne({
        _id:accountId,
        user:req.user._id
    })

    if(!account){
        return res.status(404).json({
            message:"Account not found"
        })
    }
    const balance=await account.getBalance();
    res.status(200).json({
        accountId:account._id,
    balance:balance
    })
}

module.exports={
    createAccountController,
    getAllAccountsController,
    getAccountBalanceController

}