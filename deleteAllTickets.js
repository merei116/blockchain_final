// deleteAllTickets.js
const mongoose = require('mongoose');
require('dotenv').config(); // if you have environment variables

// Import your Ticket model
const Ticket = require('./models/Ticket');

// Connect to MongoDB using your connection string
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB");

    // Delete all documents in the Ticket collection
    const result = await Ticket.deleteMany({});
    console.log(`Deleted ${result.deletedCount} documents from the Ticket collection.`);
    
    // Close the connection
    mongoose.connection.close();
  })
  .catch(err => {
    console.error("Error connecting to MongoDB:", err);
  });
