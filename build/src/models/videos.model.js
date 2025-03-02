"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoModel = exports.videoTypes = void 0;
const mongoose_1 = require("mongoose");
const OperationalError_1 = require("../utils/OperationalError");
exports.videoTypes = ['movie', 'series', 'music-video', 'skit'];
const schema = new mongoose_1.Schema({
    admin_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'A video must have a title'],
        unique: true,
    },
    type: {
        type: String,
        enum: exports.videoTypes,
        required: true,
    },
    landscape_photo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'poster_images',
        required: true,
    },
    portrait_photo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'poster_images',
        required: true,
    },
    video_upload: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'video_uploads',
        default: null,
    },
    trailer_upload: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'trailers',
        default: null,
    },
    description: {
        type: String,
        trim: true,
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
    genre: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'genre_enums',
        },
    ],
    category: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'category_enums',
        },
    ],
    cast: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'cast_enums',
        },
    ],
    released_date: {
        type: Date,
    },
    expiry_date: {
        type: Date,
    },
    likes: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'users',
        },
    ],
    runtime: {
        type: String,
    },
    default_rating: {
        type: Number,
    },
    featured: {
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
    feat_expiry: {
        type: Date,
    },
    is_series: {
        type: Boolean,
        required: true,
    },
    videoLink: {
        type: String,
        default: null, // crucial for Aggregation
    },
    trailerLink: {
        type: String,
        default: null,
    },
    artist_name: {
        type: String,
    },
    active: {
        type: Boolean,
        default: true,
    },
    showViews: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.VideoModel = (0, mongoose_1.model)('videos', schema);
schema.pre('save', function (next) {
    if (this.videoLink && this.video_upload) {
        throw new OperationalError_1.OperationalError('only a videoLink OR a videoUpload can be povided', 400);
    }
    if (this.trailerLink && this.trailer_upload) {
        throw new OperationalError_1.OperationalError('only a trailerLink OR a trailerUpload can be povided', 400);
    }
    next();
});
