const express = require("express");
const Event = require("../models/Event");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, async (req, res) => {
    const event = new Event(req.body);
    await event.save();
    res.json(event);
});

router.get("/", async (req, res) => {
    const events = await Event.find();
    res.json(events);
});

module.exports = router;
