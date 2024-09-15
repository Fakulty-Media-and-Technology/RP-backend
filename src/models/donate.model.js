const mongoose = require("mongoose");

const donateSchema = new mongoose.Schema(
     {
          live_id: {
               type: mongoose.Types.ObjectId,
               ref: "lives",
               required: true,
          },
          customer_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          payment_id: {
               type: mongoose.Types.ObjectId,
               ref: "payments",
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("donates", donateSchema);
