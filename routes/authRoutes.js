const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/login", async (req, res) => {
    const { walletAddress } = req.body;
    let user = await User.findOne({ walletAddress });

    if (!user) {
        user = new User({ walletAddress });
        await user.save();
    }

    const token = jwt.sign({ walletAddress }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
});

module.exports = router;
