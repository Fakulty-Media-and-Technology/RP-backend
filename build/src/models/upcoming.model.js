"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpcomingModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['movie', 'series', 'music video', 'documentary', 'skit'],
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
    trailerLink: {
        type: String,
        default: null,
    },
    portraitPhoto: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'poster_images',
        required: true,
    },
    landscapePhoto: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'poster_images',
        required: true,
    },
    peviewTrailer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'trailers',
        default: null
    },
    reminder: {
        type: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'users',
            },
        ],
    },
    releaseDate: {
        type: Date,
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.UpcomingModel = (0, mongoose_1.model)('upcomings', schema);
