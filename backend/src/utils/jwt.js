const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { createToken, verifyToken };
