"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    customer_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
    },
    type: {
        type: String,
        enum: ['live', 'vod'],
    },
}, {
    timestamps: true,
});
exports.CommentModel = (0, mongoose_1.model)('Comment', commentSchema);
