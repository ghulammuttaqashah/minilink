const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { frontendOrigins } = require("./config/env");
const rateLimit = require("express-rate-limit");
const urlRoutes = require("./routes/url.routes");
const authRoutes = require("./routes/auth.routes");
const { redirectToUrl } = require("./controllers/url.controller");
const { requestLoggerMiddleware } = require("./middleware/request-logger.middleware");
const {
  notFoundMiddleware,
  errorMiddleware,
} = require("./middleware/error.middleware");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || frontendOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "10kb" }));
app.use(requestLoggerMiddleware);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "AUTH_RATE_LIMITED", message: "Too many authentication attempts, please try again later." } },
});

app.get("/health", (req, res) => {
  res.json({ data: { status: "ok" } });
});

app.get("/", (req, res) => {
  res.json({
    data: {
      name: "minilink-api",
      status: "ok",
      health: "/health",
    },
  });
});

app.use("/api/v1/urls", apiLimiter, urlRoutes);
app.use("/api/v1/auth", authLimiter, authRoutes);
app.get("/:shortCode", redirectToUrl);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
