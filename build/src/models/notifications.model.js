"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    value_id: {
        type: String,
    },
    type: {
        type: String,
        enum: ['NEW_ARRIVAL', 'SYSTEM'],
        default: 'NEW_ARRIVAL',
    },
    content_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    photo: {
        Bucket: String,
        Key: String,
    },
    seen: {
        type: Boolean,
        default: false,
    },
    categories: [String],
}, {
    timestamps: true,
});
exports.NotificationModel = (0, mongoose_1.model)('Notification', notificationSchema);
