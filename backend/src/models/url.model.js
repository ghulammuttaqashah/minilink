const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    anonymousOwnerTokenHash: {
      type: String,
      index: true,
      select: false,
    },
    customerName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    creatorIpHash: {
      type: String,
      select: false,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Url = mongoose.model("Url", urlSchema);

module.exports = Url;
