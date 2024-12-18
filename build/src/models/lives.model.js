"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveModel = void 0;
const mongoose_1 = require("mongoose");
const livesSchema = new mongoose_1.Schema({
    client_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    payment_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
    },
    extpayment_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
    },
    title: {
        type: String,
        required: true,
    },
    sub_title: {
        type: String,
        required: true,
    },
    stream_key: {
        type: String,
    },
    location: {
        type: String,
        required: true,
    },
    cover_photo: {
        type: Object,
        required: true,
    },
    preview_video: {
        type: Object,
    },
    vid_class: {
        type: String,
        enum: ['free', 'ad', 'exclusive', 'premium'],
        required: true,
    },
    pg: {
        type: String,
        required: true,
    },
    category: {
        type: [String],
        ref: 'CategoryEnum',
    },
    description: {
        type: String,
    },
    active: {
        type: Boolean,
        default: false,
    },
    expired: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        enum: ['channel', 'event', 'tvshow', 'podcast', 'sport'],
    },
    participants: {
        type: Number,
        default: 0,
    },
    start: {
        type: Date,
    },
    expiry: {
        type: Date,
    },
    views: {
        type: Number,
    },
    active_views: {
        type: Number,
    },
    likes: {
        type: [String],
    },
    sponsored: {
        type: Boolean,
        required: true,
    },
    popular: {
        type: Boolean,
        required: true,
    },
    featured: {
        type: Boolean,
        default: false,
    },
    feat_expiry: {
        type: Date,
    },
}, {
    timestamps: true,
});
exports.LiveModel = (0, mongoose_1.model)('Live', livesSchema);
