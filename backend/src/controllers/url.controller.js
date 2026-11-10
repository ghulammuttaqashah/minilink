const {
  createShortUrl,
  findByShortCode,
  incrementClickCount,
  serializeUrl,
  listUrls,
} = require("../services/url.service");
const { validateOriginalUrl, validateCustomerName, validateCustomCode } = require("../validators/url.validator");
const { AppError } = require("../utils/errors");

async function createUrl(req, res, next) {
  try {
    const originalUrl = validateOriginalUrl(req.body?.originalUrl);
    const data = await createShortUrl(originalUrl, {
      ownerId: req.user?.id,
      customerName: validateCustomerName(req.body?.customerName),
      customCode: validateCustomCode(req.body?.customCode),
      creatorIp: req.ip,
      anonymousOwnerToken: req.headers["x-anonymous-owner-token"],
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

async function listUserUrls(req, res, next) {
  try {
    res.json({ data: await listUrls(req.user.id) });
  } catch (error) {
    next(error);
  }
}

async function getUrl(req, res, next) {
  try {
    const url = await findByShortCode(req.params.shortCode);
    if (!url) {
      throw new AppError(404, "URL_NOT_FOUND", "Short URL was not found");
    }

    res.json({ data: serializeUrl(url) });
  } catch (error) {
    next(error);
  }
}

async function redirectToUrl(req, res, next) {
  try {
    const url = await findByShortCode(req.params.shortCode);
    if (!url) {
      throw new AppError(404, "URL_NOT_FOUND", "Short URL was not found");
    }

    await incrementClickCount(url);
    res.redirect(302, url.originalUrl);
  } catch (error) {
    next(error);
  }
}

module.exports = { createUrl, getUrl, redirectToUrl, listUserUrls };
