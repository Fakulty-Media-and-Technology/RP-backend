const mongoose = require("mongoose");

const voteinfoSchema = new mongoose.Schema(
     {
          live_id: {
               type: mongoose.Types.ObjectId,
               ref: "lives",
               required: true,
          },
          client_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          price: {
               type: Number,
               required: true,
          },
          status: {
               type: Boolean,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("voteinfos", voteinfoSchema);
