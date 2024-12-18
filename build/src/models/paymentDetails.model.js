"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentDetailModel = void 0;
const mongoose_1 = require("mongoose");
const paymentDetailsSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    authorization_code: {
        type: String,
    },
    last4: {
        type: String,
    },
    exp_month: {
        type: String,
    },
    exp_year: {
        type: String,
    },
    brand: {
        type: String,
    },
}, {
    timestamps: true,
});
exports.PaymentDetailModel = (0, mongoose_1.model)('payment_details', paymentDetailsSchema);
