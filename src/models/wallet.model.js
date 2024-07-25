const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
     {
          user_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
               unique: true,
          },
          balance: {
               type: Number,
               default: 0,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("wallet", walletSchema);
