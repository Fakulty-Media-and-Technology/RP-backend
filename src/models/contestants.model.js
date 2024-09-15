const mongoose = require("mongoose");

const contestantSchema = new mongoose.Schema(
     {
          live_id: {
               type: mongoose.Types.ObjectId,
               ref: "lives",
               required: true,
          },
          names: {
               type: String,
               required: true,
          },
          photo: {
               type: Object,
               required: true,
          },
          occupation: {
               type: String,
               required: true,
          },
          bio: {
               type: String,
               required: true,
          },
          contact: {
               type: String,
               required: true,
          },
          votes: {
               type: Number,
               default: 0,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("contestants", contestantSchema);
