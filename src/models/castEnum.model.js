const mongoose = require("mongoose");

const castEnumSchema = new mongoose.Schema(
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

module.exports = mongoose.model("cast_enum", castEnumSchema);
