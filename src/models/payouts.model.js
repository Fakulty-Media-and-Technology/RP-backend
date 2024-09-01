const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
     {
          client_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          amount: {
               type: Number,
               required: true,
          },
          account_number: {
               type: String,
               required: true,
          },
          account_name: {
               type: String,
               required: true,
          },
          bank_name: {
               type: String,
               required: true,
          },
          status: {
               type: String,
               enum: ["pending", "reversed", "successful", "failed"],
               default: "pending",
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("payouts", payoutSchema);
