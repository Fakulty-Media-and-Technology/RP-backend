"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastEnumModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
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
schema.index({ title: 1, name: 1 }, { unique: true });
exports.CastEnumModel = (0, mongoose_1.model)('cast_enums', schema);
