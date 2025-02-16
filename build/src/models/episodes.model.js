"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpisodeModel = void 0;
const mongoose_1 = require("mongoose");
const OperationalError_1 = require("../utils/OperationalError");
const schema = new mongoose_1.Schema({
    admin: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    season: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'seasons',
        required: true,
    },
    episodeNumber: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: String,
    trailerLink: {
        type: String,
        default: null,
    },
    videoLink: {
        type: String,
        default: null,
    },
    trailerUpload: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'trailer',
        default: null,
    },
    videoUpload: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'video_uploads',
        default: null,
    },
}, { timestamps: true });
schema.index({ season: 1, title: 1 }, { unique: true });
schema.index({ season: 1, episodeNumber: 1 }, { unique: true });
schema.pre('validate', function (next) {
    if (!!this.trailerLink === !!this.trailerUpload) {
        throw new OperationalError_1.OperationalError('provide either trailerLink or trailerUpload', 400);
    }
    if (!!this.videoLink === !!this.videoUpload) {
        throw new OperationalError_1.OperationalError('provide either a videoLink or a videoUpload', 400);
    }
    next();
});
exports.EpisodeModel = (0, mongoose_1.model)('episodes', schema);
