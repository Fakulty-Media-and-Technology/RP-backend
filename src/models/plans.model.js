const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
     {
          admin_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          months_duration: {
               type: Number,
               unique: true,
               enum: [1, 3, 6, 12],
               required: true,
          },
          price: {
               type: Number,
               required: true,
          },
          details: {
               type: String,
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("plans", planSchema);
