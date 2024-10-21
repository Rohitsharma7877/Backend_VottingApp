const express = require("express");
require("dotenv").config();
const db = require("./config/db");
require("dotenv").config();
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Welcome to Voting App");
});

// const clientIP = req.header['x-forwarded-for'] || req.connection.remoteAddress;

// const { jwtAuthMiddleware} = require("./Middleware/jwt");

//import router
const userRoutes = require("./routes/userRoutes");
const CandidateRoutes = require("./routes/candidateRoutes");

//Use routers
app.use("/user", userRoutes);
app.use("/candidate", CandidateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
