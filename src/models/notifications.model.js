const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
     {
          user_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          value_id: {
               type: String,
          },
          type: {
               type: String,
               enum: ["NEW_ARRIVAL", "SYSTEM"],
               default: "NEW_ARRIVAL",
          },
          content_id: {
               type: mongoose.Types.ObjectId,
               ref: "videos",
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
               Bucket: String,
               Key: String,
          },
          seen: {
               type: Boolean,
               default: false,
          },
          categories: [String],
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("notifications", notificationSchema);
