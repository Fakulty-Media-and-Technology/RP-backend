"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreEnumModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    position: {
        type: Number,
        required: [true, 'A genre must have a number'],
        unique: true,
    },
    name: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: true,
    },
}, {
    timestamps: true,
});
schema.index({ position: 1, name: -1 }, { unique: true });
exports.GenreEnumModel = (0, mongoose_1.model)('genre_enums', schema);
