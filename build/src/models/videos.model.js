"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoModel = void 0;
const mongoose_1 = require("mongoose");
const videosSchema = new mongoose_1.Schema({
    admin_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        unique: true,
    },
    sub_title: {
        type: String,
    },
    type: {
        type: String,
        enum: ['movie', 'series', 'music video', 'skit'],
        required: true,
    },
    bucket: {
        type: String,
        trim: true,
        // required: true,
    },
    key: {
        type: String,
        trim: true,
        unique: true,
        // required: true,
    },
    description: {
        type: String,
        trim: true,
        // required: true,
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
    genre: {
        type: [String], //mongoose.SchemaTypes.ObjectId
        ref: 'GenreEnum',
    },
    category: {
        type: [String],
        ref: 'CategoryEnum',
    },
    cast: {
        type: [String],
        ref: 'CastEnum',
    },
    released_date: {
        type: Date,
    },
    expiry_date: {
        type: Date,
    },
    likes: {
        type: [String],
    },
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
    feat_expiry: {
        type: Date,
    },
    is_series: {
        type: Boolean,
        required: true,
    },
    // seasons: {
    //      type: Number,
    // },
    episodes: [
        {
            season: Number,
            episode_number: Number,
            episode_title: String,
            episode_description: String,
            bucket: String,
            key: String,
        },
    ],
    artist_name: {
        //for music video
        type: String,
    },
}, {
    timestamps: true,
});
exports.VideoModel = (0, mongoose_1.model)('Video', videosSchema);
