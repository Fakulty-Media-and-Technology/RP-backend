"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const assets_1 = require("./assets");
const commentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    message: {
        type: String,
    },
    parentType: {
        type: String,
        enum: assets_1.assets,
        required: [true, 'A comment must have a type'],
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'A comment must have a parent Id'],
    },
}, {
    timestamps: true,
});
exports.CommentModel = (0, mongoose_1.model)('comments', commentSchema);
