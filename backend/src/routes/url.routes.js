const express = require("express");
const {
  createUrl,
  getUrl,
  redirectToUrl,
  listUserUrls,
  deleteUserUrl,
} = require("../controllers/url.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", optionalAuth, createUrl);
router.get("/mine", requireAuth, listUserUrls);
router.delete("/:id", requireAuth, deleteUserUrl);
router.get("/:shortCode", getUrl);

module.exports = router;
