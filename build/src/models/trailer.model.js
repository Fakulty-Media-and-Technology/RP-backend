"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrailerModel = void 0;
const mongoose_1 = require("mongoose");
const trailerSchema = new mongoose_1.Schema({
    video_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Video',
        // unique: true,
    },
    video_title: {
        type: String,
        // required: true,
    },
    details: {
        type: String,
        // required: true,
    },
    bucket: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
exports.TrailerModel = (0, mongoose_1.model)('Trailer', trailerSchema);
