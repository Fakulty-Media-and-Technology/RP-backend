"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPaymentController = void 0;
const giftcard_model_1 = require("../../models/giftcard.model");
const payments_model_1 = require("../../models/payments.model");
const plans_model_1 = require("../../models/plans.model");
const subscription_model_1 = require("../../models/subscription.model");
const wallet_model_1 = require("../../models/wallet.model");
const SubscriptionRepo_1 = require("../../repositories/SubscriptionRepo");
const CustomenrPaymentService_1 = require("../../services/core/CustomenrPaymentService");
const catchAsync_1 = require("../../utils/catchAsync");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const responder_1 = require("../../utils/responder");
/**
 * This file is currently partially split to a service layer
 * The process of splitting is time consuming while the bugs are still not fixed.
 * As such, splitting operations will have to wait until the entire app is converted to ts files and all bugs have been fixed.
 * Author: Desmond Odion <d_clipse@icloud.com>
 * Date: 12/16/2024
 */
class CustomerPaymentController {
}
exports.CustomerPaymentController = CustomerPaymentController;
_a = CustomerPaymentController;
CustomerPaymentController.startPayment = catchAsync_1.Catch.async(async ({ user, body }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CustomenrPaymentService_1.CustomerPaymentService.startPayment(GetDefined_1.GetDefined.loggedInUser(user), body),
        message: 'payment initiated',
    });
});
CustomerPaymentController.authorizePayment = catchAsync_1.Catch.async(async ({ user, body: { amount_charge } }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'payment authorization successfull',
        data: await CustomenrPaymentService_1.CustomerPaymentService.authorizePayment(GetDefined_1.GetDefined.loggedInUser(user), amount_charge),
    });
});
CustomerPaymentController.createPayment = catchAsync_1.Catch.async(async ({ user, body }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'payment created and authorization activated',
        data: await CustomenrPaymentService_1.CustomerPaymentService.createPayment(GetDefined_1.GetDefined.loggedInUser(user), body),
    });
});
CustomerPaymentController.getPaymentReceipt = catchAsync_1.Catch.async(async (req, res) => {
    const { reference } = req.query;
    if (typeof reference !== 'string') {
        throw new OperationalError_1.OperationalError('required query.reference must be a string', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        data: await CustomenrPaymentService_1.CustomerPaymentService.getPaymentRecepit(reference),
        message: 'Payment initiated',
    });
});
CustomerPaymentController.transactionHistory = catchAsync_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CustomenrPaymentService_1.CustomerPaymentService.getTransactionHistory(GetDefined_1.GetDefined.loggedInUser(req.user)),
        message: 'transaction history fetched',
    });
});
CustomerPaymentController.addPayment = catchAsync_1.Catch.async(async ({ user, body }, res) => {
    await CustomenrPaymentService_1.CustomerPaymentService.addPayment(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'Payment added successfully',
    });
});
CustomerPaymentController.fetchPlans = catchAsync_1.Catch.async(async (_, res) => {
    const plans = await plans_model_1.PlanModel.find({
        months_duration: { $gt: 0 },
    }).select('-__v');
    (0, responder_1.sendResponse)({
        res,
        data: plans,
        message: 'Plans Fetched',
    });
});
CustomerPaymentController.createSubscription = catchAsync_1.Catch.async(async (req, res) => {
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { source, plan_id, reference } = req.body;
    if (source !== 'wallet' && source !== 'payment') {
        throw new OperationalError_1.OperationalError('subscription source must be specified: wallet/payment', 400);
    }
    const checkSub = await SubscriptionRepo_1.SubscriptionRepo.findOneActiveUserSub(user.id);
    if (checkSub) {
        throw new OperationalError_1.OperationalError('you still have an active subscription', 400);
    }
    const plan = await plans_model_1.PlanModel.findOne({
        _id: plan_id,
    });
    if (plan == null) {
        throw new OperationalError_1.OperationalError('paln not found for user', 404);
    }
    if (source === 'wallet') {
        const cusWallet = await wallet_model_1.WalletModel.findOne({
            user_id: user._id,
        });
        if (cusWallet == null) {
            throw new OperationalError_1.OperationalError('wallet not found for user', 404);
        }
        if (plan.price > cusWallet.balance) {
            throw new OperationalError_1.OperationalError('insufficient balance', 400);
        }
        // TODO: Use session
        await new subscription_model_1.SubscriptionModel({
            user_id: user._id,
            plan_id: plan_id,
            start_date: new Date(),
            expiry_date: plan.getFutureDate(),
            payment_method: 'wallet',
            amount: Number(plan.price),
        }).save();
        await wallet_model_1.WalletModel.findOneAndUpdate({
            _id: cusWallet._id,
            user_id: user._id,
        }, {
            $inc: {
                balance: -Number(plan.price),
            },
        }, {
            upsert: true,
        });
        (0, responder_1.sendResponse)({
            res,
            message: 'subscription created successfully from wallet',
        });
        return;
    }
    const payDet = await payments_model_1.PaymentModel.findOne({
        reference: reference,
        user_id: user._id,
        status: 'success',
        is_used: false,
    });
    if (payDet === null) {
        throw new OperationalError_1.OperationalError('something went wrong: payment unsuccessful or used by you', 400);
    }
    if (payDet.amount !== plan.price) {
        throw new OperationalError_1.OperationalError('amount paid and subscription plan price does not match', 400);
    }
    // TODO: Use Session
    await new subscription_model_1.SubscriptionModel({
        user_id: user._id,
        plan_id: plan_id,
        start_date: new Date(),
        expiry_date: plan.getFutureDate(),
        payment_method: 'direct-payment',
        amount: Number(plan.price),
    }).save();
    await payments_model_1.PaymentModel.findOneAndUpdate({
        _id: payDet._id,
        reference: reference,
    }, {
        is_used: true,
    }, {
        upsert: true,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'subscription created successfully by direct payment',
    });
});
CustomerPaymentController.userSubStatus = catchAsync_1.Catch.async(async (req, res) => {
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    const checkSub = await SubscriptionRepo_1.SubscriptionRepo.findOneActiveUserSub(user.id).sort({ _id: -1 });
    if (checkSub == null) {
        throw new OperationalError_1.OperationalError('you do not have any active subscription', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        data: checkSub,
        message: 'subscription status fetched',
    });
});
CustomerPaymentController.topupWallet = catchAsync_1.Catch.async(async (req, res) => {
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { reference } = req.body;
    const paymentVerif = await payments_model_1.PaymentModel.findOne({
        reference: reference,
        user_id: user._id,
        status: 'success',
        is_used: false,
    });
    if (!paymentVerif) {
        throw new OperationalError_1.OperationalError('something went wrong, payement not valid', 400);
    }
    // TODO: use session
    await wallet_model_1.WalletModel.findOneAndUpdate({
        user_id: user._id,
    }, {
        $inc: {
            balance: paymentVerif.amount,
        },
    }, {
        upsert: true,
        new: true,
    });
    await payments_model_1.PaymentModel.findOneAndUpdate({
        _id: paymentVerif._id,
    }, {
        is_used: true,
        use_case: 'topup',
    }, {
        upsert: true,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'top uo successful',
    });
});
CustomerPaymentController.fetchWallet = catchAsync_1.Catch.async(async (req, res) => {
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    const custBalance = await wallet_model_1.WalletModel.find({ user_id: user._id }).select('-__v');
    (0, responder_1.sendResponse)({
        res,
        data: custBalance,
        message: 'user allet info',
    });
});
CustomerPaymentController.redeemGiftCard = catchAsync_1.Catch.async(async (req, res) => {
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { gift_code } = req.query;
    const giftCard = await giftcard_model_1.GiftCardModel.findOne({
        code: gift_code,
    });
    if (!giftCard) {
        throw new OperationalError_1.OperationalError('invalid gift code entered', 404);
    }
    if (giftCard.used) {
        throw new OperationalError_1.OperationalError('Oops, voucher has been used', 400);
    }
    // TODO: Use session
    await wallet_model_1.WalletModel.findOneAndUpdate({
        user_id: user._id,
    }, {
        $inc: {
            balance: giftCard.amount,
        },
    }, {
        upsert: true,
    });
    giftCard.used = true;
    await giftCard.save();
    (0, responder_1.sendResponse)({
        res,
        message: 'giftcard has been redeemed and credited to your wallet successfully',
    });
});
