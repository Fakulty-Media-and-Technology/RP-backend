const mongoose = require("mongoose");

const posterSchema = new mongoose.Schema(
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
          portrait_photo: {
               type: Object,
          },
          landscape_photo: {
               type: Object,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("poster_image", posterSchema);
