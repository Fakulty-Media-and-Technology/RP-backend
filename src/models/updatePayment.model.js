const mongoose = require("mongoose");

const paymentDetailsSchema = new mongoose.Schema(
     {
          user: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User", // Reference to the User model
               required: true,
          },
          authorization_codes: {
               type: String,
          },
          last4: {
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

module.exports = mongoose.model("PaymentDetails", paymentDetailsSchema);
