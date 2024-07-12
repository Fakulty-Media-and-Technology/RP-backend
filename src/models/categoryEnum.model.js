const mongoose = require("mongoose");

const categoryEnumSchema = new mongoose.Schema(
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

module.exports = mongoose.model("category_enum", categoryEnumSchema);
