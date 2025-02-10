const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
    tokenId: { type: Number, required: true, unique: true },
    owner: { type: String, required: true },
    price: { type: String, required: true },
    forSale: { type: Boolean, default: false },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" }
});

module.exports = mongoose.model("Ticket", TicketSchema);
