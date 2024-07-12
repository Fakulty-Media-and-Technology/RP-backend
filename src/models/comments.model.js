const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
     {
          customer_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          message: {
               type: String,
          },
          type: {
               type: String,
               enum: ["live", "vod"],
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("comment", commentSchema);
