"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutModel = void 0;
const mongoose_1 = require("mongoose");
const payoutSchema = new mongoose_1.Schema({
    client_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    processed_by: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'users',
    },
    amount: {
        type: Number,
        required: true,
    },
    charges: {
        type: Number,
    },
    account_number: {
        type: String,
        required: true,
    },
    account_name: {
        type: String,
        required: true,
    },
    bank_name: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'reversed', 'rejected', 'completed'],
        default: 'pending',
    },
}, {
    timestamps: true,
});
exports.PayoutModel = (0, mongoose_1.model)('payouts', payoutSchema);
