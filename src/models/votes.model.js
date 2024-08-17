const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
     {
          live_id: {
               type: mongoose.Types.ObjectId,
               ref: "lives",
               required: true,
          },
          voter_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          contestant_id: {
               type: mongoose.Types.ObjectId,
               ref: "contestants",
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

module.exports = mongoose.model("votes", voteSchema);
