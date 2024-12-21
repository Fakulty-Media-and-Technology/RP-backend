"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpcomingModel = void 0;
const mongoose_1 = require("mongoose");
const upcomingSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['movie', 'series', 'music video', 'ducumentary', 'skit'],
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
    reminder: {
        type: [String], //user ids that subscribe
    },
    release_date: {
        type: Date,
        required: true,
    },
    portrait_photo: {
        type: Object,
        required: true,
    },
    landscape_photo: {
        type: Object,
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    trailer_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Trailer',
        required: true,
    },
}, {
    timestamps: true,
});
exports.UpcomingModel = (0, mongoose_1.model)('Upcoming', upcomingSchema);
