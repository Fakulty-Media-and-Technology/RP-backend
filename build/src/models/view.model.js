"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewModel = void 0;
const mongoose_1 = require("mongoose");
const assets_1 = require("./assets");
const schema = new mongoose_1.Schema({
    viewer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    content: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    contentType: {
        type: String,
        enum: assets_1.viewContents,
        required: true,
    },
});
// schema.index({ viewer: 1, content: 1 }, { unique: true })
// on the off chance that two contents from have the same ID
schema.index({ viewer: 1, content: 1, contentType: 1 }, { unique: true });
exports.ViewModel = (0, mongoose_1.model)('views', schema);
