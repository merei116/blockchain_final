// interaction.js

const Web3 = require('web3').default;
const fs = require('fs');
const path = require('path');

// Connect to your local Ganache blockchain (adjust URL/port if necessary)
const web3 = new Web3('http://127.0.0.1:8545');

// Load the compiled contract artifact
const artifactPath = path.resolve(__dirname, 'build', 'TicketNFT.json');
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const { abi } = contractArtifact;

// Replace this with the actual deployed contract address from deploy.js
const contractAddress = '0xeEef7c5Ba150DDE6a05445Bb1c79cEca9514C88d';

// Create a contract instance using the ABI and deployed address
const contract = new web3.eth.Contract(abi, contractAddress);

const interact = async () => {
  try {
    // Retrieve accounts provided by Ganache
    const accounts = await web3.eth.getAccounts();
    const owner = accounts[0]; // Contract owner (used for minting)
    const user = accounts[1];  // Ticket recipient (initial ticket owner)
    const buyer = accounts[2]; // Buyer for the resale ticket

    console.log("Using accounts:");
    console.log("  Owner:", owner);
    console.log("  User (ticket recipient):", user);
    console.log("  Buyer (resale purchaser):", buyer);

    // ------------------------------------------------------------------------
    // Step 1: Mint a Ticket
    // ------------------------------------------------------------------------
    // Ticket base price: 0.1 Ether
    const basePrice = web3.utils.toWei('0.1', 'ether');
    console.log(`Minting a ticket for ${user} with base price ${basePrice} wei...`);
    await contract.methods.mintTicket(user, basePrice).send({
      from: owner,
      gas: 500000
    });
    console.log("Ticket minted with tokenId: 0");

    // ------------------------------------------------------------------------
    // Step 2: List the Ticket for Sale
    // ------------------------------------------------------------------------
    // Listing sale price: 0.2 Ether
    const salePrice1 = web3.utils.toWei('0.2', 'ether');
    console.log(`Listing ticket (tokenId 0) for sale at ${salePrice1} wei by ${user}...`);
    await contract.methods.listTicketForSale(0, salePrice1).send({
      from: user,
      gas: 500000
    });
    console.log("Ticket listed for sale at price:", salePrice1);

    // ------------------------------------------------------------------------
    // Step 3: Cancel the Sale Listing
    // ------------------------------------------------------------------------
    console.log(`Cancelling ticket sale listing (tokenId 0) by ${user}...`);
    await contract.methods.cancelTicketSale(0).send({
      from: user,
      gas: 500000
    });
    console.log("Ticket sale listing cancelled.");

    // ------------------------------------------------------------------------
    // Step 4: Re-list the Ticket for Sale at a New Price
    // ------------------------------------------------------------------------
    // New sale price: 0.3 Ether
    const salePrice2 = web3.utils.toWei('0.3', 'ether');
    console.log(`Re-listing ticket (tokenId 0) for sale at ${salePrice2} wei by ${user}...`);
    await contract.methods.listTicketForSale(0, salePrice2).send({
      from: user,
      gas: 500000
    });
    console.log("Ticket re-listed for sale at price:", salePrice2);

    // ------------------------------------------------------------------------
    // Step 5: Purchase the Ticket
    // ------------------------------------------------------------------------
    console.log(`Buyer ${buyer} is attempting to purchase ticket (tokenId 0) for ${salePrice2} wei...`);
    await contract.methods.purchaseTicket(0).send({
      from: buyer,
      gas: 500000,
      value: salePrice2
    });
    console.log("Ticket purchased by:", buyer);

    // ------------------------------------------------------------------------
    // Step 6: Validate the Ticket
    // ------------------------------------------------------------------------
    console.log(`New owner (${buyer}) validating ticket (tokenId 0)...`);
    await contract.methods.validateTicket(0).send({
      from: buyer,
      gas: 500000
    });
    console.log("Ticket validated by:", buyer);

  } catch (error) {
    console.error("Interaction failed:", error);
  }
};

interact();
