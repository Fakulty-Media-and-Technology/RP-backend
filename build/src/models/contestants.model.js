"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContestantsModel = void 0;
const mongoose_1 = require("mongoose");
const contestantSchema = new mongoose_1.Schema({
    live_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Live',
        required: true,
    },
    names: {
        type: String,
        required: true,
    },
    photo: {
        type: Object,
        required: true,
    },
    occupation: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        required: true,
    },
    contact: {
        type: String,
        required: true,
    },
    votes: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
exports.ContestantsModel = (0, mongoose_1.model)('Contestant', contestantSchema);
