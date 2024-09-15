const mongoose = require("mongoose");

const videosSchema = new mongoose.Schema(
     {
          admin_id: {
               type: mongoose.SchemaTypes.ObjectId,
               ref: "users",
               required: true,
          },
          title: {
               type: String,
               required: true,
               unique: true,
          },
          sub_title: {
               type: String,
          },
          type: {
               type: String,
               enum: ["movie", "series", "music video", "skit"],
               required: true,
          },
          bucket: {
               type: String,
               trim: true,
               // required: true,
          },
          key: {
               type: String,
               trim: true,
               unique: true,
               // required: true,
          },
          description: {
               type: String,
               trim: true,
               // required: true,
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
          genre: {
               type: [String], //mongoose.SchemaTypes.ObjectId
               ref: "genre_enum",
          },
          category: {
               type: [String],
               ref: "category_enum",
          },
          cast: {
               type: [String],
               ref: "cast_enum",
          },
          released_date: {
               type: Date,
          },
          expiry_date: {
               type: Date,
          },
          likes: {
               type: [String],
          },
          runtime: {
               type: String,
          },
          default_rating: {
               type: Number,
          },
          featured: {
               type: Boolean,
               default: false,
          },
          feat_expiry: {
               type: Date,
          },
          is_series: {
               type: Boolean,
               required: true,
          },
          // seasons: {
          //      type: Number,
          // },
          episodes: [
               {
                    season: Number,
                    episode_number: Number,
                    episode_title: String,
                    episode_description: String,
                    bucket: String,
                    key: String,
               },
          ],
          artist_name: {
               //for music video
               type: String,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("videos", videosSchema);
