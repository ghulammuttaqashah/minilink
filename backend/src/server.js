const http = require("node:http");
const app = require("./app");
const { nodeEnv, port } = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/database");

let server;

async function start() {
  console.log(`Starting URL shortener backend (${nodeEnv})...`);
  await connectDatabase();
  server = http.createServer(app);

  server.listen(port, () => {
    console.log(`Backend server is running at http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();
  console.log("Backend shutdown complete");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
});
