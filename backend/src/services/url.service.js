const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Url = require("../models/url.model");
const { generateShortCode } = require("../utils/short-code");
const { AppError } = require("../utils/errors");
const { publicBaseUrl, jwtSecret } = require("../config/env");

function hashValue(value) {
  return crypto.createHmac("sha256", jwtSecret).update(value).digest("hex");
}

async function createShortUrl(originalUrl, options = {}) {
  const { ownerId = null, customerName = null, customCode = null, creatorIp = null, anonymousOwnerToken = null } = options;
  const ownershipToken = ownerId ? null : anonymousOwnerToken || crypto.randomBytes(32).toString("base64url");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shortCode = customCode || generateShortCode();

    try {
      const url = await Url.create({
        originalUrl,
        shortCode,
        ownerId,
        customerName,
        anonymousOwnerTokenHash: ownerId ? null : hashValue(ownershipToken),
        creatorIpHash: creatorIp ? hashValue(creatorIp) : null,
      });
      return {
        id: url.id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: `${publicBaseUrl}/${url.shortCode}`,
        clickCount: url.clickCount,
        createdAt: url.createdAt,
        customerName: url.customerName,
        ownershipToken,
      };
    } catch (error) {
      if (error?.code === 11000 && customCode) {
        throw new AppError(409, "SHORT_CODE_IN_USE", "That custom short code is already in use");
      }
      if (error?.code !== 11000 || customCode || attempt === 2) {
        throw error;
      }

    }
  }

  throw new AppError(500, "SHORT_CODE_ERROR", "Could not generate a unique short code");
}

async function listUrls(ownerId) {
  const urls = await Url.find({ ownerId }).sort({ createdAt: -1 }).limit(100);
  return urls.map(serializeUrl);
}

async function deleteUrl(urlId, ownerId) {
  if (!mongoose.isValidObjectId(urlId)) {
    throw new AppError(404, "URL_NOT_FOUND", "That link was not found in your workspace");
  }
  const deletedUrl = await Url.findOneAndDelete({ _id: urlId, ownerId });
  if (!deletedUrl) {
    throw new AppError(404, "URL_NOT_FOUND", "That link was not found in your workspace");
  }
  return deletedUrl;
}

async function findByShortCode(shortCode) {
  return Url.findOne({ shortCode });
}

async function incrementClickCount(url) {
  url.clickCount += 1;
  url.clickHistory.push(new Date());
  if (url.clickHistory.length > 90) {
    url.clickHistory = url.clickHistory.slice(-90);
  }
  await url.save();
}

function serializeUrl(url) {
  return {
    id: url.id,
    originalUrl: url.originalUrl,
    shortCode: url.shortCode,
    shortUrl: `${publicBaseUrl}/${url.shortCode}`,
    clickCount: url.clickCount,
    clickHistory: url.clickHistory || [],
    createdAt: url.createdAt,
    updatedAt: url.updatedAt,
    customerName: url.customerName,
  };
}

module.exports = {
  createShortUrl,
  findByShortCode,
  incrementClickCount,
  serializeUrl,
  listUrls,
  deleteUrl,
};
