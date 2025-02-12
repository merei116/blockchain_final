const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TicketSchema = new Schema(
  {
    ticketId: { type: Number, required: true, unique: true },
    owner: { type: String, required: true },
    basePrice: { type: String, required: true }, // stored in Wei as a string
    tokenURI: { type: String, required: true },
    validated: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', TicketSchema);
