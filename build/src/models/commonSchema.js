"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewVideoSchema = exports.previewPhotoSchema = void 0;
const mongoose_1 = require("mongoose");
exports.previewPhotoSchema = new mongoose_1.Schema({
    Bucket: { type: String, required: true },
    Key: { type: String, required: true },
    ContentType: { type: String },
}, { timestamps: false, _id: false, versionKey: false });
exports.previewVideoSchema = new mongoose_1.Schema({
    bucket: { type: String, required: true },
    key: { type: String, required: true },
}, { timestamps: false, _id: false, versionKey: false });
