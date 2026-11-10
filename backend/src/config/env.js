require("dotenv").config();

const nodeEnv = process.env.NODE_ENV || "development";
const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const required = ["MONGODB_URI", "PUBLIC_BASE_URL"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0 && nodeEnv !== "test") {
  throw new Error(
    `Missing required environment variables: ${missing.join(
      ", "
    )}. Create backend/.env from backend/.env.example and fill in the values.`
  );
}

module.exports = {
  nodeEnv,
  port,
  mongodbUri: process.env.MONGODB_URI,
  mongodbDatabase: process.env.MONGODB_DB_NAME || "url_shortener",
  jwtSecret: process.env.JWT_SECRET || "development-only-change-me",
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/+$/, ""),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};
