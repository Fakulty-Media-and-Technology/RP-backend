"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmanagerModel = void 0;
const mongoose_1 = require("mongoose");
const admanagerSchema = new mongoose_1.Schema({
    title: {
        type: String,
    },
    sub_title: {
        type: String,
    },
    type: {
        type: String,
        enum: ['general', 'movie_ad', 'web', 'mobile'],
    },
    brand: {
        type: String,
    },
    photo: {
        type: Object,
    },
    link: {
        type: String,
    },
    duration: {
        type: String,
    },
    start: {
        type: Date,
    },
    expiry: {
        type: Date,
    },
    active: {
        type: Boolean,
        //    default: true
    },
}, {
    timestamps: true,
});
exports.AdmanagerModel = (0, mongoose_1.model)('Admanager', admanagerSchema);
