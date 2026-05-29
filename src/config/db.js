
require("dotenv").config();

const mongoose=require("mongoose")

function connectToDB(){
    mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log("server is connected to the database.")
    })
    .catch(err=>{
        console.log("error in connecting to the database.",err);
        process.exit(1);
    })
}

module.exports=connectToDB;