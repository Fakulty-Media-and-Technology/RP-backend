const mongoose = require("mongoose");

const upcomingSchema = new mongoose.Schema(
     {
          title: {
               type: String,
               required: true,
          },
          type: {
               type: String,
               enum: ["movie", "series", "music video", "ducumentary", "skit"],
               required: true,
          },
          details: {
               type: String,
               required: true,
          },
          reminder: {
               type: [String], //user ids that subscribe
          },
          release_date: {
               type: Date,
               required: true,
          },
          portrait_photo: {
               type: Object,
               required: true,
          },
          landscape_photo: {
               type: Object,
               required: true,
          },
          active: {
               type: Boolean,
               default: true,
          },
          trailer_id: {
               type: mongoose.Types.ObjectId,
               ref: "trailer",
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("upcoming", upcomingSchema);
