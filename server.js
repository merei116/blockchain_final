/**
 * Comprehensive Backend for NFT Ticketing System
 * - Uses Express for API endpoints.
 * - Uses Web3.js to interact with the deployed smart contract.
 * - Uses Mongoose to interact with MongoDB for off-chain data.
 */

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Web3 = require('web3').default;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import the Ticket model
const Ticket = require('./models/Ticket');

const app = express();
app.use(bodyParser.json());

// --- Connect to MongoDB ---
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// --- Connect to Ganache ---
const web3 = new Web3(process.env.GANACHE_URL);
const artifactPath = path.resolve(__dirname, 'build', 'TicketNFT.json');
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const { abi } = contractArtifact;

// Create a contract instance using the ABI and the deployed address from .env
const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);

// Get the admin account (assuming accounts[0] is the deployer/owner)
let adminAccount;
web3.eth.getAccounts()
  .then(accounts => {
    adminAccount = accounts[0];
    console.log("Admin account:", adminAccount);
  })
  .catch(err => console.error("Error fetching accounts:", err));

// --- Utility: Convert Ether to Wei ---
const toWei = (amount) => web3.utils.toWei(amount.toString(), 'ether');

function bigIntReplacer(key, value) {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * API Endpoint: Mint Ticket
 * - Only the admin (contract owner) can mint tickets.
 * - Request Body: { to: "recipient_address", price: "ticket price in Ether", tokenURI: "token URI" }
 */
app.post('/mintTicket', async (req, res) => {
  try {
    const { to, price, tokenURI } = req.body;
    if (!to || !price || !tokenURI) {
      return res.status(400).json({ error: "Missing 'to', 'price' or 'tokenURI'" });
    }
    const priceWei = web3.utils.toWei(price.toString(), 'ether');

    const tx = await contract.methods.mintTicket(to, priceWei, tokenURI).send({
      from: adminAccount,
      gas: 5000000,
      gasPrice: '20000000000'
    });

    // Extract tokenId from TicketMinted event
    let ticketId;
    if (tx.events && tx.events.TicketMinted) {
      ticketId = Number(tx.events.TicketMinted.returnValues.tokenId);
    } else {
      console.error("No TicketMinted event found in transaction response:", tx);
      return res.status(500).json({ error: "Minting successful, but event data is missing." });
    }

    // Save ticket data to MongoDB
    const newTicket = new Ticket({
      ticketId,
      owner: to,
      basePrice: priceWei.toString(),
      tokenURI,
      validated: false
    });
    await newTicket.save();

    res.json({
      message: "Ticket minted successfully",
      ticket: {
        ticketId: ticketId.toString(),
        owner: to,
        basePrice: priceWei.toString(),
        tokenURI,
        validated: false
      },
      transaction: {
        gasUsed: tx.gasUsed.toString(),
        blockNumber: tx.blockNumber.toString()
      }
    });
  } catch (error) {
    console.error("Mint Ticket Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});

/**
 * API Endpoint: Buy Ticket
 * - Allows any user to buy a ticket using the buyTicket function.
 * - Request Body: { tokenURI: "token URI", buyer: "buyer address", value: "price in Ether" }
 */
app.post('/buyTicket', async (req, res) => {
  try {
    const { tokenURI, buyer, value } = req.body;
    if (!tokenURI || !buyer || !value) {
      return res.status(400).json({ error: "Missing 'tokenURI', 'buyer' or 'value'" });
    }
    const valueWei = web3.utils.toWei(value.toString(), 'ether');
    const tx = await contract.methods.buyTicket(tokenURI).send({
      from: buyer,
      gas: 5000000,
      gasPrice: '20000000000',
      value: valueWei
    });
    // Extract tokenId from TicketMinted event
    let ticketId;
    if (tx.events && tx.events.TicketMinted) {
      ticketId = Number(tx.events.TicketMinted.returnValues.tokenId);
    } else {
      console.error("No TicketMinted event found in transaction response:", tx);
      return res.status(500).json({ error: "Ticket purchase successful, but event data is missing." });
    }
    // Save ticket data to MongoDB
    const newTicket = new Ticket({
      ticketId,
      owner: buyer,
      basePrice: valueWei.toString(),
      tokenURI,
      validated: false
    });
    await newTicket.save();

    res.json({
      message: "Ticket purchased successfully",
      ticket: {
        ticketId: ticketId.toString(),
        owner: buyer,
        basePrice: valueWei.toString(),
        tokenURI,
        validated: false
      },
      transaction: {
        gasUsed: tx.gasUsed.toString(),
        blockNumber: tx.blockNumber.toString()
      }
    });
  } catch (error) {
    console.error("Buy Ticket Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});

/**
 * API Endpoint: Validate Ticket
 * - Only the owner can validate a ticket.
 * - Request Body: { ticketId: number, owner: "ticket owner's address" }
 */
app.post('/validateTicket', async (req, res) => {
  try {
    const { ticketId, owner } = req.body;
    if (ticketId === undefined || !owner) {
      return res.status(400).json({ error: "Missing ticketId or owner" });
    }
    const tx = await contract.methods.validateTicket(ticketId).send({
      from: owner,
      gas: 5000000,
      gasPrice: '20000000000'
    });
    // Update the ticket document in the database (set validated to true)
    await Ticket.findOneAndUpdate({ ticketId }, { validated: true });
    
    // Convert any BigInt values to strings before sending the response
    const safeTx = JSON.parse(JSON.stringify(tx, bigIntReplacer));
    
    res.json({ message: "Ticket validated", transaction: safeTx });
  } catch (error) {
    console.error("Validate Ticket Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});


/**
 * API Endpoint: Get All Tickets (from the database)
 */
app.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find({});
    res.json({ tickets });
  } catch (error) {
    console.error("Get Tickets Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
