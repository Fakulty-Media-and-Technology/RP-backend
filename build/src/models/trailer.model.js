"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrailerModel = void 0;
const mongoose_1 = require("mongoose");
const trailerSchema = new mongoose_1.Schema({
    video_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Video',
        required: [true, 'A trailer must belong to a video'],
    },
    video_upload: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'video_uploads',
        required: [true, 'A trailer must have a video upload'],
    },
    parentType: {
        type: String,
        enum: ['vod', 'episode', 'season', 'upcoming'],
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.TrailerModel = (0, mongoose_1.model)('trailers', trailerSchema);
