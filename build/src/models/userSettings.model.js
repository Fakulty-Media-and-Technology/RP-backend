"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsModel = void 0;
const mongoose_1 = require("mongoose");
const settingsSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
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
        enum: ['480p', '720p', '1080p'],
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
}, {
    timestamps: true,
});
exports.SettingsModel = (0, mongoose_1.model)('Setting', settingsSchema);
