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
    description: {
        type: String,
        default: null,
    },
});
schema.index({ video: 1, serial_number: 1 }, { unique: true });
exports.SeasonModel = (0, mongoose_1.model)('seasons', schema);
