"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingModel = void 0;
const mongoose_1 = require("mongoose");
const ratingSchema = new mongoose_1.Schema({
    video_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
    },
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rate: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
        required: true,
    },
    comment: {
        type: String,
    },
}, {
    timestamps: true,
});
exports.RatingModel = (0, mongoose_1.model)('Rating', ratingSchema);
