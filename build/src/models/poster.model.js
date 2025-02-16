"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosterImageModel = void 0;
const mongoose_1 = require("mongoose");
const posterSchema = new mongoose_1.Schema({
    video_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    bucket: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    dimension: {
        type: String,
        enum: ['landscape', 'portrait', null],
        default: null,
    },
    parentType: {
        type: String,
        enum: ['vod', 'live', 'season', 'episode', 'upcoming'],
        required: [true, 'A poster must have a parent type'],
    },
}, {
    timestamps: true,
});
exports.PosterImageModel = (0, mongoose_1.model)('poster_images', posterSchema);
