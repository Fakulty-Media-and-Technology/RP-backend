"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubtitleModel = void 0;
const mongoose_1 = require("mongoose");
const subtitleSchema = new mongoose_1.Schema({
    video_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    parentType: {
        type: String,
        enum: ['vod', 'episode'],
        required: true,
    },
    key: {
        type: String,
        unique: true,
        required: [true, 'A subtitle must have a key'],
    },
    bucket: {
        type: String,
        required: [true, 'A subtitle must have a bucket'],
    },
    language: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, 'A subtitle must have a language'],
    },
}, {
    timestamps: true,
});
subtitleSchema.index({ video_id: 1, language: 1 }, { unique: true });
exports.SubtitleModel = (0, mongoose_1.model)('sub_titles', subtitleSchema);
