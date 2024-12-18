"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteInfoModel = void 0;
const mongoose_1 = require("mongoose");
const voteinfoSchema = new mongoose_1.Schema({
    live_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Live',
        required: true,
    },
    client_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    status: {
        type: Boolean,
    },
}, {
    timestamps: true,
});
exports.VoteInfoModel = (0, mongoose_1.model)('VoteInfo', voteinfoSchema);
