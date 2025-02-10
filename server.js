const express = require("express");
require("dotenv").config();
require("./config");

const app = express();
app.use(express.json());

app.use("/auth", require("./routes/authRoutes"));
app.use("/events", require("./routes/eventRoutes"));
app.use("/tickets", require("./routes/ticketRoutes"));

app.listen(5000, () => console.log("Server running on port 5000"));
