require("dotenv").config()

const app=require("./src/app");
const connectToDB=require("./src/config/db");

//console.log("My URI string is: ", process.env.MONGODB_URI);

connectToDB();
app.listen(3000,()=>{
    console.log("Server is listening to port 3000.");
});
