"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastEnumModel = void 0;
const mongoose_1 = require("mongoose");
const castEnumSchema = new mongoose_1.Schema({
    title: {
        type: String,
        trim: true,
        required: true,
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
exports.CastEnumModel = (0, mongoose_1.model)('CastEnum', castEnumSchema);
