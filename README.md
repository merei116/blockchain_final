# blockchain_final

Project structure
/nft-ticketing-backend
  ├── server.js           # Main server file
  ├── config.js           # Blockchain and DB configurations
  ├── routes/
  │   ├── authRoutes.js   # User authentication routes
  │   ├── eventRoutes.js  # Event management routes
  │   ├── ticketRoutes.js # NFT ticket routes
  ├── models/
  │   ├── User.js         # User schema
  │   ├── Event.js        # Event schema
  │   ├── Ticket.js       # NFT Ticket schema
  ├── controllers/
  │   ├── authController.js
  │   ├── eventController.js
  │   ├── ticketController.js
  ├── middleware/
  │   ├── authMiddleware.js
  ├── .env               # Environment variables
  ├── package.json
