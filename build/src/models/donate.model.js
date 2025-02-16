"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonateModel = void 0;
const mongoose_1 = require("mongoose");
const donateSchema = new mongoose_1.Schema({
    live_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Live',
        required: true,
    },
    customer_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
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
exports.DonateModel = (0, mongoose_1.model)('donates', donateSchema);
