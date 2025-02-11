const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TicketSchema = new Schema(
  {
    ticketId: { type: Number, required: true, unique: true },
    owner: { type: String, required: true },
    basePrice: { type: String, required: true }, // stored in Wei (as a string)
    validated: { type: Boolean, default: false },
    salePrice: { type: String, default: "0" }      // "0" means not for sale
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', TicketSchema);
