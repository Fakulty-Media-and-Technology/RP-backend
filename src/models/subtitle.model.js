const mongoose = require("mongoose");

const subtitleSchema = new mongoose.Schema(
     {
          video_id: {
               type: mongoose.Types.ObjectId,
               ref: "videos",
               required: true,
          },
          key: {
               type: String,
               required: true,
          },
          language: {
               type: String,
               trim: true,
               lowercase: true,
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("sub_title", subtitleSchema);
