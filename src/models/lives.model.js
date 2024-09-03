const mongoose = require("mongoose");

const liveVideosSchema = new mongoose.Schema(
     {
          client_id: {
               type: mongoose.Types.ObjectId,
               ref: "users",
               required: true,
          },
          title: {
               type: String,
               required: true,
          },
          sub_title: {
               type: String,
               required: true,
          },
          stream_key: {
               type: String,
               required: true,
          },
          cover_photo: {
               type: Object,
               required: true,
          },
          vid_class: {
               type: String,
               enum: ["free", "ad", "exclusive", "premium"],
               required: true,
          },
          pg: {
               type: String,
               required: true,
          },
          category: {
               type: [String],
               ref: "category_enum",
          },
          description: {
               type: String,
          },
          active: {
               type: Boolean,
               default: false,
          },
          type: {
               type: String,
               enum: ["channel", "event", "tvshow"],
          },
          participants: {
               type: Number,
               default: 0,
          },
          start: {
               type: Number, //Date in milisec
          },
          expiry: {
               type: Number,
          },
          views: {
               type: Number,
          },
          active_views: {
               type: Number,
          },
          likes: {
               type: [String],
          },
          sponsored: {
               type: Boolean,
               required: true,
          },
          sponsored: {
               type: Boolean,
               required: true,
          },
          popular: {
               type: Boolean,
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("live", liveVideosSchema);
