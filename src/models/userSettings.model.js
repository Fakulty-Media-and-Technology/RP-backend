const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "users",
            required: true,
        },
        interest: {
            type: [String],
            lowercase: true,
        },
        watchlist: {
            type: [String],
            lowercase: true,
        },
        video_quality: {
            type: String,
            lowercase: true,
            enum: ["144p", "240p", "360p", "480p", "720p", "1080p"],
        },
        //Notification Settings
        allow_notifications: {
            type: Boolean,
            default: true,
        },
        new_services: {
            type: Boolean,
            default: false,
        },
        upcoming_events: {
            type: Boolean,
            default: false,
        },
        new_arrivals: {
            type: Boolean,
            default: false,
        },
        live_channels: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("settings", settingsSchema);
