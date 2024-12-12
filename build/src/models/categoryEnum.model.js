"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryEumModel = void 0;
const mongoose_1 = require("mongoose");
const categoryEnumSchema = new mongoose_1.Schema({
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
exports.CategoryEumModel = (0, mongoose_1.model)('CategoryEnum', categoryEnumSchema);
