const mongoose = require("mongoose");

const subtitleSchema = new mongoose.Schema(
     {
          video_id: {
               type: mongoose.Types.ObjectId,
               ref: "videos",
               required: true,
          },
          bucket: {
               type: String,
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
          is_series: {
               type: Boolean,
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("sub_title", subtitleSchema);
