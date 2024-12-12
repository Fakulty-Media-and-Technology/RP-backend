"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftCardModel = void 0;
const mongoose_1 = require("mongoose");
const giftcardVideosSchema = new mongoose_1.Schema({
    admin_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serial_number: {
        type: Number,
        //    required: true,
        unique: true,
        default: 0,
    },
    amount: {
        type: Number,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    used: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.GiftCardModel = (0, mongoose_1.model)('Giftcard', giftcardVideosSchema);
