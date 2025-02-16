"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingModel = void 0;
const mongoose_1 = require("mongoose");
const assets_1 = require("./assets");
const ratingSchema = new mongoose_1.Schema({
    parentType: {
        type: String,
        enum: assets_1.ratingsParent,
        required: true,
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    rate: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    comment: {
        type: String,
    },
}, {
    timestamps: true,
});
ratingSchema.index({ parentType: 1, parentId: 1, userId: 1 }, { unique: true });
exports.RatingModel = (0, mongoose_1.model)('ratings', ratingSchema);
