const mongoose = require("mongoose");

const InstagramVideoSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      trim: true,
    },

    instagramLink: {
      type: String,
      required: true, // link to your IG post
    },

    videoUrl: {
      type: String,
      required: true, // hosted MP4 (S3 / DO / local)
    },

    thumbnail: {
      type: String, // optional fallback image
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InstagramVideo", InstagramVideoSchema);
