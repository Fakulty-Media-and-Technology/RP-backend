"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteModel = void 0;
const mongoose_1 = require("mongoose");
const voteSchema = new mongoose_1.Schema({
    live_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Live',
        required: true,
    },
    voter_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    contestant_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Contestant',
        required: true,
    },
    payment_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
    },
}, {
    timestamps: true,
});
exports.VoteModel = (0, mongoose_1.model)('Vote', voteSchema);
