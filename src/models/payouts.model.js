const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
     {
          client_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          processed_by: {
               type: [mongoose.Types.ObjectId],
               ref: "users",
          },
          amount: {
               type: Number,
               required: true,
          },
          charges: {
               type: Number,
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
               enum: [
                    "pending",
                    "processing",
                    "reversed",
                    "rejected",
                    "completed",
               ],
               default: "pending",
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("payouts", payoutSchema);
