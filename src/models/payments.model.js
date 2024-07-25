const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
     {
          user_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          full_name: {
               type: String,
               required: true,
          },
          email: {
               type: String,
               required: true,
          },
          amount: {
               type: Number,
               required: true,
          },
          reference: {
               type: String,
               required: true,
          },
          status: {
               type: String,
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("payment", paymentSchema);
