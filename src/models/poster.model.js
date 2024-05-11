const mongoose = require("mongoose");

const posterSchema = new mongoose.Schema(
    {
        video_id: {
            type: mongoose.Types.ObjectId,
            ref: "videos",
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        dimension: {
            type: String,
            enum: ["portrait", "landscape"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("poster_image", posterSchema);
