"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRepo = void 0;
const wallet_model_1 = require("../models/wallet.model");
class WalletRepo {
}
exports.WalletRepo = WalletRepo;
WalletRepo.totalBalance = () => wallet_model_1.WalletModel.aggregate([
    {
        $match: {
            $expr: {
                $ne: ['$user_id', null],
            },
        },
    },
    {
        $group: {
            _id: null,
            total_balance: { $sum: '$balance' },
        },
    },
    {
        $project: {
            _id: 0,
            total_balance: 1,
        },
    },
]);
