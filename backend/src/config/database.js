const mongoose = require("mongoose");
const { mongodbUri, mongodbDatabase } = require("./env");

async function connectDatabase() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongodbUri, { dbName: mongodbDatabase });
  console.log(`MongoDB connected successfully (database: ${mongodbDatabase})`);
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}

module.exports = { connectDatabase, disconnectDatabase };
