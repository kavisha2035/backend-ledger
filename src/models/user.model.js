const mongoose = require("mongoose");
// 1. Added the missing bcrypt import
const bcrypt = require("bcrypt"); 

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required for creating a user"],
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/],
        unique: [true, "Email already exists"] // Cleaned up the message string
    },
    name: {
        type: String,
        required: [true, "Name is required for creating an account."]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: [6, "Password should be at least 6 characters."],
        select: false
    },systemUser: {
        type:Boolean,
        default:false,
        immutable:true,
        //select:false

    }
}, { // 2. Correctly closed the fields object before opening the options object
    timestamps: true
});

// Middleware to hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return ;
    }
    // Fixed the spacing typo 'bcrypt .hash'
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    return ;
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
