const crypto = require("node:crypto");

function generateShortCode(length = 7) {
  return crypto
    .randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64url")
    .slice(0, length);
}

module.exports = { generateShortCode };
