require("dotenv").config();
const Web3 = require("web3");
const mongoose = require("mongoose");

const INFURA_URL = process.env.INFURA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ABI = require("./contractABI.json"); // Smart contract ABI

// Connect to Ethereum
const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));
const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
const tx = await contract.methods.mintTicket(price).send({
    from: wallet.address, // instead of wallet[0].address
    gas: 500000,
  });
  

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Error:", err));

module.exports = { web3, contract, wallet };
