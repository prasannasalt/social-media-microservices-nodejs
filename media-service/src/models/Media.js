const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
    },
    orignalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Media = mongoose.model("Media", mediaSchema);

module.exports = Media;
