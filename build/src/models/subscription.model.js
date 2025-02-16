"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    plan_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'plans',
        required: true,
    },
    start_date: {
        type: Date,
        required: true,
    },
    expiry_date: {
        type: Date,
        required: true,
    },
    payment_method: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.SubscriptionModel = (0, mongoose_1.model)('subscriptions', schema);
