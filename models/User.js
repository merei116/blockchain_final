const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }
});

module.exports = mongoose.model("User", UserSchema);
