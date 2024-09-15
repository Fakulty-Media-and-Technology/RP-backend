const mongoose = require("mongoose");

const paymentDetailsSchema = new mongoose.Schema(
     {
          user_id: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "users",
               required: true,
          },
          authorization_code: {
               type: String,
          },
          last4: {
               type: String,
          },
          exp_month: {
               type: String,
          },
          exp_year: {
               type: String,
          },
          brand: {
               type: String,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("payment_details", paymentDetailsSchema);
