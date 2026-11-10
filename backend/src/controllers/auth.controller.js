const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { AppError } = require("../utils/errors");
const { createToken } = require("../utils/jwt");
const { validateCredentials, validateRegistrationPassword } = require("../validators/auth.validator");

function serializeUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

async function register(req, res, next) {
  try {
    const { name, email, password } = validateCredentials(req.body);
    if (!name) throw new AppError(400, "VALIDATION_ERROR", "Name is required");
    validateRegistrationPassword(password);
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ data: { user: serializeUser(user), token: createToken(user) } });
  } catch (error) {
    next(error.code === 11000
      ? new AppError(409, "EMAIL_IN_USE", "An account with this email already exists")
      : error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = validateCredentials(req.body);
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, "AUTH_INVALID", "Email or password is incorrect");
    }
    res.json({ data: { user: serializeUser(user), token: createToken(user) } });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.json({ data: { user: serializeUser(req.user) } });
}

module.exports = { register, login, me };
