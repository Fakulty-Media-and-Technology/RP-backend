"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubtitleModel = void 0;
const mongoose_1 = require("mongoose");
const subtitleSchema = new mongoose_1.Schema({
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
    language: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
    },
    is_series: {
        type: Boolean,
        required: true,
    },
}, {
    timestamps: true,
});
exports.SubtitleModel = (0, mongoose_1.model)('sub_titles', subtitleSchema);
