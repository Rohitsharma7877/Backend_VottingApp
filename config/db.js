const mongoose = require("mongoose");
require("dotenv").config();

// const mongoURL = process.env.mongoDB_URL_LOCAL;
const mongoURL = process.env.mongoDB_URL;
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("connected", () => {
  console.log("Connected to MongoDB");
});

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

db.on("disconnected", () => {
  console.log("MongoDB Connected");
});

module.exports = db;
