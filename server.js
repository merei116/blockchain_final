/**
 * Comprehensive Backend for NFT Ticketing System
 * - Uses Express for API endpoints.
 * - Uses Web3.js to interact with the deployed smart contract.
 * - Uses Mongoose to interact with MongoDB for off-chain data.
 */

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Web3 = require('web3').default; // Use .default if needed
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

/**
 * API Endpoint: Mint Ticket
 * - Only the admin (contract owner) can mint tickets.
 * - Request Body: { to: "recipient_address", price: "ticket price in Ether" }
 */
app.post('/mintTicket', async (req, res) => {
  try {
    const { to, price } = req.body;
    if (!to || !price) {
      return res.status(400).json({ error: "Missing 'to' or 'price'" });
    }
    const priceWei = web3.utils.toWei(price.toString(), 'ether');

    const tx = await contract.methods.mintTicket(to, priceWei).send({
      from: adminAccount,
      gas: 5000000,
      gasPrice: '20000000000'
    });

    // Convert BigInt to Number before saving to MongoDB
    let ticketId;
    if (tx.events && tx.events.TicketMinted) {
      ticketId = Number(tx.events.TicketMinted.returnValues.tokenId);
    } else {
      console.error("🚨 No TicketMinted event found in transaction response:", tx);
      return res.status(500).json({ error: "Minting successful, but event data is missing." });
    }

    // Save ticket data to MongoDB
    const newTicket = new Ticket({
      ticketId, // Stored as a Number
      owner: to,
      basePrice: priceWei.toString(), // Convert price to string to avoid BigInt issues
      validated: false,
      salePrice: "0"
    });
    await newTicket.save();

    // Convert all BigInt values to strings before sending response
    res.json({
      message: "✅ Ticket minted successfully",
      ticket: {
        ticketId: ticketId.toString(), // Ensure ticketId is a string
        owner: to,
        basePrice: priceWei.toString(), // Convert BigInt to string
        validated: false,
        salePrice: "0"
      },
      transaction: {
        ...tx,
        gasUsed: tx.gasUsed.toString(), // Convert gasUsed to string
        blockNumber: tx.blockNumber.toString(), // Convert blockNumber to string
      }
    });

  } catch (error) {
    console.error("❌ Mint Ticket Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});


/**
 * API Endpoint: List Ticket For Sale
 * - Request Body: { ticketId: number, salePrice: "price in Ether", owner: "ticket owner's address" }
 */
app.post('/listTicketForSale', async (req, res) => {
  try {
    const { ticketId, salePrice, owner } = req.body;
    if (ticketId === undefined || !salePrice || !owner) {
      return res.status(400).json({ error: "Missing ticketId, salePrice, or owner" });
    }
    const salePriceWei = toWei(salePrice);
    const tx = await contract.methods.listTicketForSale(ticketId, salePriceWei).send({
      from: owner,
      gas: 5000000,
      gasPrice: '20000000000'
    });
    // Update the ticket document in the database
    await Ticket.findOneAndUpdate({ ticketId }, { salePrice: salePriceWei });
    res.json({ message: "Ticket listed for sale", transaction: tx });
  } catch (error) {
    console.error("List Ticket For Sale Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});

/**
 * API Endpoint: Cancel Ticket Sale
 * - Request Body: { ticketId: number, owner: "ticket owner's address" }
 */
app.post('/cancelTicketSale', async (req, res) => {
  try {
    const { ticketId, owner } = req.body;
    if (ticketId === undefined || !owner) {
      return res.status(400).json({ error: "Missing ticketId or owner" });
    }
    const tx = await contract.methods.cancelTicketSale(ticketId).send({
      from: owner,
      gas: 5000000,
      gasPrice: '20000000000'
    });
    // Update the ticket in the database (set salePrice back to "0")
    await Ticket.findOneAndUpdate({ ticketId }, { salePrice: "0" });
    res.json({ message: "Ticket sale cancelled", transaction: tx });
  } catch (error) {
    console.error("Cancel Ticket Sale Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});

/**
 * API Endpoint: Purchase Ticket
 * - Request Body: { ticketId: number, buyer: "buyer address" }
 */
app.post('/purchaseTicket', async (req, res) => {
  try {
    const { ticketId, buyer } = req.body;
    if (ticketId === undefined || !buyer) {
      return res.status(400).json({ error: "Missing ticketId or buyer" });
    }
    // Get the sale price from the contract
    const salePriceWei = await contract.methods.ticketSalePrice(ticketId).call();
    if (salePriceWei == 0) {
      return res.status(400).json({ error: "Ticket is not listed for sale" });
    }
    const tx = await contract.methods.purchaseTicket(ticketId).send({
      from: buyer,
      gas: 5000000,
      gasPrice: '20000000000',
      value: salePriceWei
    });
    // Update the ticket in the database: change owner and reset salePrice
    await Ticket.findOneAndUpdate({ ticketId }, { owner: buyer, salePrice: "0" });
    res.json({ message: "Ticket purchased", transaction: tx });
  } catch (error) {
    console.error("Purchase Ticket Error:", error);
    res.status(500).json({ error: error.toString() });
  }
});

/**
 * API Endpoint: Validate Ticket
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
    // Mark the ticket as validated in the database
    await Ticket.findOneAndUpdate({ ticketId }, { validated: true });
    res.json({ message: "Ticket validated", transaction: tx });
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
