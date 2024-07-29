const mongoose = require("mongoose");

const giftcardVideosSchema = new mongoose.Schema(
     {
          admin_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          serial_number: {
               type: Number,
               //    required: true,
               unique: true,
               default: 0,
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

module.exports = mongoose.model("giftcard", giftcardVideosSchema);
