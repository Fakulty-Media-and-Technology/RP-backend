const mongoose = require("mongoose");

const featuredSchema = new mongoose.Schema(
    {
        video_id: {
            type: mongoose.Types.ObjectId,
            ref: "videos",
            required: true,
        },
        expiry: {
            type: Number,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("featured", featuredSchema);
