const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
     {
          user_id: {
               type: mongoose.SchemaTypes.ObjectId,
               ref: "users",
               required: true,
          },
          value_id: {
               type: String,
          },
          type: {
               type: String,
               // enum: [],
               required: true,
          },
          title: {
               type: String,
               required: true,
          },
          body: {
               type: String,
               required: true,
          },
          photo: {
               type: String,
          },
          seen: {
               type: Boolean,
               default: false,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("notifications", notificationSchema);
