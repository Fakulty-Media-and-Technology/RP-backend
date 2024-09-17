const mongoose = require("mongoose");

const posterSchema = new mongoose.Schema(
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
          dimension: {
               type: String,
               enum: ["landscape", "portrait"],
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("poster_image", posterSchema);
