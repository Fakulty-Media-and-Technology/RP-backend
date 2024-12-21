"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalService = void 0;
const env_1 = __importDefault(require("../../env"));
const payouts_model_1 = require("../../models/payouts.model");
const wallet_model_1 = require("../../models/wallet.model");
const OperationalError_1 = require("../../utils/OperationalError");
class WithdrawalService {
}
exports.WithdrawalService = WithdrawalService;
_a = WithdrawalService;
WithdrawalService.requestPayout = async (currentUser, data) => {
    const { amount, account_number, account_name, bank_name } = data;
    if (!amount || !account_name || !account_name || !bank_name) {
        throw new OperationalError_1.OperationalError('all input are required', 400);
    }
    const unresolvedPay = await payouts_model_1.PayoutModel.findOne({
        client_id: currentUser.id,
        status: { $in: ['pending', 'processing'] },
    });
    if (unresolvedPay !== null) {
        throw new OperationalError_1.OperationalError("you've already requested for an unresolved payout request", 400);
    }
    const accBal = await wallet_model_1.WalletModel.findOne({ user_id: currentUser._id });
    if (accBal === null) {
        throw new OperationalError_1.OperationalError('Account balance does not exist', 404);
    }
    if (Number(amount) > accBal.balance) {
        throw new OperationalError_1.OperationalError('insufficient balance', 404);
    }
    //check minimum withdrawal
    const minimumWithdrawal = 50000;
    if (Number(amount) < minimumWithdrawal) {
        throw new OperationalError_1.OperationalError('requested amount is below limit of 50000', 400);
    }
    //remove board charges
    const percent = 15; //todo, admin can always modify
    const finAmount = amount - (Number(amount) * Number(percent)) / 100;
    await payouts_model_1.PayoutModel.create({
        client_id: currentUser._id,
        amount: finAmount,
        charges: (Number(amount) * Number(percent)) / 100,
        account_number,
        account_name,
        bank_name,
    });
};
WithdrawalService.editPayout = async (currentUser, payoutId, data) => {
    const { amount, account_number, account_name, bank_name } = data;
    const initVal = await payouts_model_1.PayoutModel.findOne({
        _id: payoutId,
        status: 'pending',
        client_id: currentUser._id,
    });
    if (!initVal) {
        throw new OperationalError_1.OperationalError("payout request can no longer be modified, it's being processed", 400);
    }
    const accBal = await wallet_model_1.WalletModel.findOne({ user_id: currentUser._id });
    if (Number(amount) > Number(accBal?.balance)) {
        throw new OperationalError_1.OperationalError('insufficient balance', 400);
    }
    if (Number(amount) < env_1.default.MIN_WITHDRAWAL_AMOUNT) {
        throw new OperationalError_1.OperationalError(`requested amount is below limit of ${env_1.default.MIN_WITHDRAWAL_AMOUNT}`, 400);
    }
    const finAmount = amount - (Number(amount) * env_1.default.WITHDRAWAL_PERCENT) / 100;
    await payouts_model_1.PayoutModel.findOneAndUpdate({
        _id: payoutId,
        client_id: currentUser._id,
    }, {
        amount: amount ? finAmount : initVal.amount,
        account_number: account_number ? account_number : initVal.account_number,
        account_name: account_name ? account_name : initVal.account_name,
        bank_name: bank_name ? account_name : initVal.bank_name,
    }, {
        upsert: true,
    });
};
WithdrawalService.requestAllPayoutInfo = async (currentUser) => {
    return await payouts_model_1.PayoutModel.find({ client_id: currentUser.id });
};
WithdrawalService.requestPayoutInfoGroups = async (currentUser) => {
    return await payouts_model_1.PayoutModel.aggregate([
        {
            $match: {
                client_id: currentUser._id,
            },
        },
        {
            $group: {
                _id: '$status',
                group: { $push: '$$ROOT' },
            },
        },
    ]);
};
