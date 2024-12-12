"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreEnumModel = void 0;
const mongoose_1 = require("mongoose");
const genreEnumSchema = new mongoose_1.Schema({
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
exports.GenreEnumModel = (0, mongoose_1.model)('GenreEnum', genreEnumSchema);
