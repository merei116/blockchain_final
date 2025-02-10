const express = require("express");
const { web3, contract, wallet } = require("../config");
const Ticket = require("../models/Ticket");

const router = express.Router();

router.post("/mint", async (req, res) => {
    const { eventId, owner, price } = req.body;
    const ticketId = await contract.methods.totalSupply().call() + 1;

    const tx = await contract.methods.mintTicket(price).send({
        from: wallet[0].address,
        gas: 500000,
    });

    const newTicket = new Ticket({ tokenId: ticketId, owner, price, event: eventId });
    await newTicket.save();

    res.json({ message: "Ticket minted", tx, newTicket });
});

router.post("/buy", async (req, res) => {
    const { ticketId, buyer } = req.body;
    const ticket = await Ticket.findOne({ tokenId: ticketId });

    const tx = await contract.methods.buyTicket(ticketId).send({
        from: buyer,
        value: ticket.price,
        gas: 300000,
    });

    ticket.owner = buyer;
    ticket.forSale = false;
    await ticket.save();

    res.json({ message: "Ticket purchased", tx, ticket });
});

module.exports = router;
