const mongoose = require("mongoose");

const genreEnumSchema = new mongoose.Schema(
     {
          name: {
               type: String,
               trim: true,
               lowercase: true,
               unique: true,
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

module.exports = mongoose.model("genre_enum", genreEnumSchema);
