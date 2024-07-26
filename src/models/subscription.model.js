const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
     {
          user_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          plan_id: {
               type: mongoose.Types.ObjectId,
               ref: "plans",
               required: true,
          },
          start_date: {
               type: Date,
               required: true,
          },
          expiry_date: {
               type: Date,
               required: true,
          },
          payment_method: {
               type: String,
               required: true,
          },
          amount: {
               type: Number,
               required: true,
          },
          active: {
               type: Boolean,
               default: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("subscriptions", subscriptionSchema);
