"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedModel = void 0;
const mongoose_1 = require("mongoose");
const featuredSchema = new mongoose_1.Schema({
    video_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
    },
    expiry: {
        type: Number,
    },
}, {
    timestamps: true,
});
exports.FeaturedModel = (0, mongoose_1.model)('Featured', featuredSchema);
