const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { frontendOrigin } = require("./config/env");
const urlRoutes = require("./routes/url.routes");
const authRoutes = require("./routes/auth.routes");
const { redirectToUrl } = require("./controllers/url.controller");
const { requestLoggerMiddleware } = require("./middleware/request-logger.middleware");
const {
  notFoundMiddleware,
  errorMiddleware,
} = require("./middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "10kb" }));
app.use(requestLoggerMiddleware);

app.get("/health", (req, res) => {
  res.json({ data: { status: "ok" } });
});

app.use("/api/v1/urls", urlRoutes);
app.use("/api/v1/auth", authRoutes);
app.get("/:shortCode", redirectToUrl);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
