// deploy.js

const Web3 = require('web3').default;
const fs = require('fs');
const path = require('path');

// Connect to Ganache (adjust the URL/port if necessary)
const web3 = new Web3('http://127.0.0.1:8545');

// Path to the compiled contract artifact (ABI and bytecode)
const artifactPath = path.resolve(__dirname, 'build', 'TicketNFT.json');
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const { abi, bytecode } = contractArtifact;

const deploy = async () => {
  try {
    // Get the list of accounts from Ganache.
    const accounts = await web3.eth.getAccounts();
    console.log("Deploying from account:", accounts[0]);

    // Create a contract instance with the ABI.
    const contractInstance = new web3.eth.Contract(abi);

    // Deploy the contract with constructor arguments.
    const deployedContract = await contractInstance.deploy({
      data: bytecode,
      arguments: ["EventTicket", "ETKT"]
    }).send({
      from: accounts[0],
      gas: 5000000,
      gasPrice: '20000000000' // 20 Gwei as an example
    });

    console.log("Contract deployed at address:", deployedContract.options.address);
  } catch (error) {
    console.error("Deployment failed:", error);
  }
};

deploy();
