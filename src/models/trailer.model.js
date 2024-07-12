const mongoose = require("mongoose");

const trailerSchema = new mongoose.Schema(
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
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("trailer", trailerSchema);
