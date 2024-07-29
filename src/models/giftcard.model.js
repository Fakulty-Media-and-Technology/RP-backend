const mongoose = require("mongoose");

const liveVideosSchema = new mongoose.Schema(
     {
          admin_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          serial_number: {
               type: String,
               required: true,
               unique: true,
          },
          amount: {
               type: Number,
               required: true,
          },
          code: {
               type: String,
               required: true,
               unique: true,
          },
          used: {
               type: Boolean,
               default: false,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("live", liveVideosSchema);
