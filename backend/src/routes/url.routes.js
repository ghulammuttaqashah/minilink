const express = require("express");
const {
  createUrl,
  getUrl,
  redirectToUrl,
  listUserUrls,
} = require("../controllers/url.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", optionalAuth, createUrl);
router.get("/mine", requireAuth, listUserUrls);
router.get("/:shortCode", getUrl);

module.exports = router;
