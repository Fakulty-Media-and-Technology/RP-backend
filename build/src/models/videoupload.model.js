"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoUploadModel = void 0;
const mongoose_1 = require("mongoose");
const s3_1 = require("../services/aws/s3");
const assets_1 = require("./assets");
const resolutionsSchema = new mongoose_1.Schema({
    resolution: {
        type: String,
        enum: ['1080', '720', '480'],
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
}, { _id: false, timestamps: false, versionKey: false });
const schema = new mongoose_1.Schema({
    bucket: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
        unique: true,
    },
    mimetype: {
        type: String,
    },
    size: {
        type: Number,
    },
    isTranscoded: {
        type: Boolean,
        default: false,
    },
    parentType: {
        type: String,
        enum: assets_1.videoUploadParents, // add more as needed
    },
    parentId: mongoose_1.Schema.Types.ObjectId,
    resolutions: {
        type: [resolutionsSchema],
        default: [],
    },
}, {
    timestamps: true,
    versionKey: false,
});
schema.pre('save', async function (next) {
    if (this.isTranscoded) {
        this.resolutions = (await s3_1.S3.setResolutionsPairs(this.key));
    }
    next();
});
exports.VideoUploadModel = (0, mongoose_1.model)('video_uploads', schema);
