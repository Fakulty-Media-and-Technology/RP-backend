"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    client_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    payment_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'payments',
    },
    extpayment_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'payments',
    },
    title: {
        type: String,
        required: true,
    },
    subTitle: {
        type: String,
    },
    stream_key: {
        type: String,
        required: true,
        unique: true,
    },
    location: {
        type: String,
        required: true,
    },
    channelLogo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'poster_images',
        default: null,
    },
    coverPhoto: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'poster_images',
        required: true,
    },
    previewVideoUpload: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'video_uploads',
        default: null,
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
        required: true,
    },
    start: {
        type: Date,
        required: true,
    },
    expiry: {
        type: Date,
        required: true,
    },
    views: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'users',
        },
    ],
    active_views: {
        type: Number,
    },
    sponsored: {
        type: Boolean,
        default: false,
    },
    popular: {
        type: Boolean,
        default: false,
    },
    upcoming: {
        type: Boolean,
        default: false,
    },
    upcomingSubscribers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'users',
        },
    ],
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
exports.LiveModel = (0, mongoose_1.model)('lives', schema);
