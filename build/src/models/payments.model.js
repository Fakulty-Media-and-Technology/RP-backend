"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = void 0;
const mongoose_1 = require("mongoose");
const paymentSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    full_name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    reference: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    is_used: {
        type: Boolean,
        default: false,
    },
    use_case: {
        type: String,
        enum: ['subscription', 'topup', 'vote', 'donate', 'live schedule', 'live schedule ext'],
    },
}, {
    timestamps: true,
});
exports.PaymentModel = (0, mongoose_1.model)('payments', paymentSchema);
