const { AppError } = require("../utils/errors");

function notFoundMiddleware(req, res, next) {
  next(new AppError(404, "ROUTE_NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
}

function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const code = error.code || "INTERNAL_SERVER_ERROR";
  const message =
    statusCode >= 500 ? "An unexpected server error occurred" : error.message;

  if (statusCode >= 500) {
    console.error(
      `[ERROR] ${req.method} ${req.originalUrl} - ${error.message}`
    );
  } else {
    console.warn(
      `[WARN] ${req.method} ${req.originalUrl} - ${statusCode} ${message}`
    );
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      details: error.details || [],
    },
  });
}

module.exports = { notFoundMiddleware, errorMiddleware };
