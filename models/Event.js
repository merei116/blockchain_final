const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    name: String,
    date: String,
    location: String,
    description: String,
    tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }]
});

module.exports = mongoose.model("Event", EventSchema);
