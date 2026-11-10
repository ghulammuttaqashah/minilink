const { AppError } = require("../utils/errors");

function validateCredentials(body = {}) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(400, "VALIDATION_ERROR", "A valid email is required");
  }
  return { name, email, password };
}

function validateRegistrationPassword(password) {
  if (password.length < 8) {
    throw new AppError(400, "VALIDATION_ERROR", "Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError(400, "VALIDATION_ERROR", "Password must include uppercase, lowercase, and a number");
  }
}

module.exports = { validateCredentials, validateRegistrationPassword };
