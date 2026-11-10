const User = require("../models/user.model");
const { AppError } = require("../utils/errors");
const { verifyToken } = require("../utils/jwt");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      throw new AppError(401, "AUTH_REQUIRED", "A Bearer token is required");
    }

    const payload = verifyToken(header.slice(7));
    const user = await User.findById(payload.sub).select("_id name email");
    if (!user) {
      throw new AppError(401, "AUTH_INVALID", "User account is no longer available");
    }

    req.user = user;
    next();
  } catch (error) {
    next(
      error.name === "JsonWebTokenError" || error.name === "TokenExpiredError"
        ? new AppError(401, "AUTH_INVALID", "The authentication token is invalid or expired")
        : error
    );
  }
}

async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header) return next();
  return requireAuth(req, res, next);
}

module.exports = { requireAuth, optionalAuth };
