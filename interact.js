// interact.js

const Web3 = require('web3').default;
const fs = require('fs');
const path = require('path');

// Connect to your local Ganache blockchain (adjust URL/port if necessary)
const web3 = new Web3('http://127.0.0.1:8545');

// Load the compiled contract artifact
const artifactPath = path.resolve(__dirname, 'build', 'TicketNFT.json');
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const { abi } = contractArtifact;

// Use the deployed contract address from your deploy output:
const contractAddress = '0xceB62dD18c054E545901eEa52337ac6e098Fd16C';

// Create a contract instance using the ABI and deployed address
const contract = new web3.eth.Contract(abi, contractAddress);

const interact = async () => {
  try {
    // Retrieve accounts provided by Ganache
    const accounts = await web3.eth.getAccounts();
    const owner = accounts[0];  // Contract owner
    const user = accounts[1];   // Ticket recipient for minting
    const buyer = accounts[2];  // Buyer using the buyTicket function

    console.log("Using accounts:");
    console.log("  Owner:", owner);
    console.log("  User (recipient):", user);
    console.log("  Buyer:", buyer);

    // ------------------------------------------------------------------------
    // Step 1: Mint a Ticket (by owner) for the designated user.
    // ------------------------------------------------------------------------
    const basePrice = web3.utils.toWei('0.1', 'ether');
    const tokenURI1 = "ipfs://ticket-metadata-0";
    console.log(`Minting a ticket for ${user} with base price ${basePrice} wei and tokenURI: ${tokenURI1}...`);
    const txMint = await contract.methods.mintTicket(user, basePrice, tokenURI1).send({
      from: owner,
      gas: 500000
    });
    console.log("Ticket minted. Transaction receipt:", txMint);

    // ------------------------------------------------------------------------
    // Step 2: Buy a Ticket (by a buyer) using the buyTicket function.
    // ------------------------------------------------------------------------
    const tokenURI2 = "ipfs://ticket-metadata-1";
    const purchasePrice = web3.utils.toWei('0.2', 'ether');
    console.log(`Buyer ${buyer} is buying a ticket with price ${purchasePrice} wei and tokenURI: ${tokenURI2}...`);
    const txBuy = await contract.methods.buyTicket(tokenURI2).send({
      from: buyer,
      gas: 500000,
      value: purchasePrice
    });
    console.log("Ticket bought. Transaction receipt:", txBuy);

    // ------------------------------------------------------------------------
    // Step 3: Validate a Ticket (by owner).
    // ------------------------------------------------------------------------
    console.log(`Owner ${owner} is validating ticket with tokenId 0...`);
    const txValidate = await contract.methods.validateTicket(0).send({
      from: owner,
      gas: 500000
    });
    console.log("Ticket validated. Transaction receipt:", txValidate);

    // ------------------------------------------------------------------------
    // Step 4: Withdraw the contract balance (by owner).
    // ------------------------------------------------------------------------
    console.log(`Owner ${owner} is withdrawing the contract balance...`);
    const txWithdraw = await contract.methods.withdraw().send({
      from: owner,
      gas: 500000
    });
    console.log("Withdrawal transaction receipt:", txWithdraw);

  } catch (error) {
    console.error("Interaction failed:", error);
  }
};

interact();
