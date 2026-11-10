const { AppError } = require("../utils/errors");

function validateOriginalUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "originalUrl is required");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(value.trim());
  } catch {
    throw new AppError(400, "VALIDATION_ERROR", "originalUrl must be a valid URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "originalUrl must use http or https"
    );
  }

  return parsedUrl.toString();
}

module.exports = { validateOriginalUrl };

function validateCustomerName(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > 100) {
    throw new AppError(400, "VALIDATION_ERROR", "customerName must be 100 characters or fewer");
  }
  return value.trim();
}

function validateCustomCode(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{3,32}$/.test(value.trim())) {
    throw new AppError(400, "VALIDATION_ERROR", "customCode must be 3-32 letters, numbers, hyphens, or underscores");
  }
  return value.trim();
}

module.exports = { validateOriginalUrl, validateCustomerName, validateCustomCode };
