"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    admin: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    video: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'videos',
        required: true,
    },
    serial_number: {
        type: Number,
        required: true,
    },
    trailer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'trailers',
        default: null,
    },
    description: {
        type: String,
        default: null,
    },
    trailerLink: {
        type: String,
        default: null,
    },
    landscapePhoto: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'poster_images',
        default: null,
        // required: true,
    },
    portraitPhoto: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'poster_images',
        default: null,
        // required: true,
    },
    // add other fields here as needed
});
schema.index({ video: 1, serial_number: 1 }, { unique: true });
exports.SeasonModel = (0, mongoose_1.model)('seasons', schema);
