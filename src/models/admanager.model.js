const mongoose = require("mongoose");

const admanagerSchema = new mongoose.Schema(
     {
          title: {
               type: String,
          },
          sub_title: {
               type: String,
          },
          type: {
               type: String,
               enum: ["general", "movie_ad", "web", "mobile"],
          },
          brand: {
               type: String,
          },
          photo: {
               type: Object,
          },
          link: {
               type: String,
          },
          duration: {
               type: String,
          },
          start: {
               type: Date,
          },
          expiry: {
               type: Date,
          },
          active: {
               type: Boolean,
               //    default: true
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("admanagers", admanagerSchema);
