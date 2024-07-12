const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
     {
          video_id: {
               type: mongoose.Types.ObjectId,
               ref: "videos",
               required: true,
          },
          user_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          rate: {
               type: Number,
               enum: [1, 2, 3, 4, 5],
               required: true,
          },
          comment: {
               type: String,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("rating", ratingSchema);
