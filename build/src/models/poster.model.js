"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosterImageModel = void 0;
const mongoose_1 = require("mongoose");
const posterSchema = new mongoose_1.Schema({
    video_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Video',
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
        enum: ['landscape', 'portrait'],
    },
}, {
    timestamps: true,
});
exports.PosterImageModel = (0, mongoose_1.model)('poster_images', posterSchema);
