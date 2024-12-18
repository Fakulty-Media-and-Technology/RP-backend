"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModel = void 0;
const mongoose_1 = require("mongoose");
const walletSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
exports.WalletModel = (0, mongoose_1.model)('Wallet', walletSchema);
