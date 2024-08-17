const mongoose = require("mongoose");

const voteinfoSchema = new mongoose.Schema(
     {
          live_id: {
               type: mongoose.Types.ObjectId,
               ref: "lives",
               required: true,
          },
          price: {
               type: Number,
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
