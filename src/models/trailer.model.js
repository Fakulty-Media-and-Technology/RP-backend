const mongoose = require("mongoose");

const trailerSchema = new mongoose.Schema(
     {
          video_id: {
               type: mongoose.Types.ObjectId,
               ref: "videos",
               // unique: true,
          },
          video_title: {
               type: String,
               // required: true,
          },
          details: {
               type: String,
               // required: true,
          },
          bucket: {
               type: String,
               required: true,
          },
          key: {
               type: String,
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("trailer", trailerSchema);
