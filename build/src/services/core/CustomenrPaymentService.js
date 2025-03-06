"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPaymentService = void 0;
const paymentDetails_model_1 = require("../../models/paymentDetails.model");
const payments_model_1 = require("../../models/payments.model");
const plans_model_1 = require("../../models/plans.model");
const paymentIntegration_1 = __importStar(require("../../paymentIntegration"));
const PaymentDetailRepo_1 = require("../../repositories/PaymentDetailRepo");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const subscription_model_1 = require("../../models/subscription.model");
const wallet_model_1 = require("../../models/wallet.model");
const SubscriptionRepo_1 = require("../../repositories/SubscriptionRepo");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
const giftcard_model_1 = require("../../models/giftcard.model");
class CustomerPaymentService {
}
exports.CustomerPaymentService = CustomerPaymentService;
_a = CustomerPaymentService;
CustomerPaymentService.startPayment = async (currentUser, data) => {
    const { email, amount } = data;
    const response = await paymentIntegration_1.default.paystackStartPayment({
        email,
        amount,
        user_id: currentUser.id,
        full_name: `${currentUser.first_name} ${currentUser.last_name}`,
    });
    return response;
};
CustomerPaymentService.addPayment = async (currentUser, data) => {
    const { authorization_code, last4, brand } = data;
    if (!authorization_code || !last4 || !brand) {
        throw new OperationalError_1.OperationalError('all input are required', 400);
    }
    await paymentDetails_model_1.PaymentDetailModel.findOneAndUpdate({
        user_id: currentUser._id,
    }, {
        authorization_code,
        last4,
        brand,
    }, { new: true, upsert: true });
};
CustomerPaymentService.authorizePayment = async (currentUser, chargeAmount) => {
    const { id, first_name, last_name, email } = currentUser;
    const payAuth = await PaymentDetailRepo_1.PaymentDetailRepo.findOneByUserId(id);
    if (payAuth == null || payAuth.authorization_code == null) {
        throw new OperationalError_1.OperationalError('payAuth or payAuth authorization code does not exist', 404);
    }
    // TODO: Use Session/transaction
    const response = await paymentIntegration_1.default.paystackAuthorizePayment({
        authorization_code: payAuth.authorization_code,
        email: email,
        amount: chargeAmount,
        user_id: id,
        full_name: `${first_name} ${last_name}`,
    });
    const { status, amount, metadata, customer, reference } = response.data;
    const newPayment = await payments_model_1.PaymentModel.create({
        reference,
        status,
        email: customer.email,
        user_id: metadata.user_id,
        full_name: metadata.full_name,
        amount: (0, paymentIntegration_1.convertKoboToNaira)(amount),
    });
    // ? Why is new Payment sent when status is failed?
    if (status !== 'success') {
        throw new OperationalError_1.OperationalError('authorize payment request unsuccessfull', 400, newPayment);
    }
    return newPayment;
};
CustomerPaymentService.createPayment = async (currentUser, data) => {
    const { reference, save_card } = data;
    const payment = await payments_model_1.PaymentModel.findOne({
        reference,
        status: 'success',
    });
    if (payment) {
        throw new OperationalError_1.OperationalError('payment reference already existed', 400);
    }
    const response = await paymentIntegration_1.default.paystackCreatePayment(reference, save_card, currentUser.id);
    return response;
};
CustomerPaymentService.getPaymentRecepit = async (reference) => {
    const response = await paymentIntegration_1.default.paystackPaymentReciept({
        reference,
    });
    return response;
};
CustomerPaymentService.getTransactionHistory = async (currentUser) => {
    const response = await payments_model_1.PaymentModel.find({
        user_id: currentUser._id,
    })
        .select('-user_id -is_used -__v')
        .sort({ createdAt: -1 });
    return response;
};
CustomerPaymentService.fetchPlans = async (query) => {
    const plansQuery = plans_model_1.PlanModel.find({
        months_duration: { $gt: 0 },
    }).select('-__v');
    const qFeatures = new QueryParamsFeatures_1.QueryParamsFeatures(plansQuery, {
        defaultLimit: 50,
        defaultPage: 1,
        queryParams: query,
    });
    return await qFeatures.paginate().query;
};
CustomerPaymentService._createSubSession = async ({ user, data }, session) => {
    const { source, plan_id, reference } = data;
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
        await new subscription_model_1.SubscriptionModel({
            user_id: user._id,
            plan_id: plan_id,
            start_date: new Date(),
            expiry_date: plan.getFutureDate(),
            payment_method: 'wallet',
            amount: Number(plan.price),
        }).save({ session });
        await wallet_model_1.WalletModel.findOneAndUpdate({
            _id: cusWallet._id,
            user_id: user._id,
        }, {
            $inc: {
                balance: -Number(plan.price),
            },
        }, {
            upsert: true,
            session,
        });
        return 'subscription created successfully from wallet';
    }
    const payDet = await payments_model_1.PaymentModel.findOne({
        reference,
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
    await new subscription_model_1.SubscriptionModel({
        user_id: user._id,
        plan_id: plan_id,
        start_date: new Date(),
        expiry_date: plan.getFutureDate(),
        payment_method: 'direct-payment',
        amount: Number(plan.price),
    }).save({ session });
    await payments_model_1.PaymentModel.findOneAndUpdate({
        _id: payDet._id,
        reference,
    }, {
        is_used: true,
    }, {
        upsert: true,
        session,
    });
    return 'subscription created successfully by direct payment';
};
CustomerPaymentService.createSub = async (input) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._createSubSession, input);
CustomerPaymentService.fetchSubStatus = async (user) => {
    const checkSub = await SubscriptionRepo_1.SubscriptionRepo.findOneActiveUserSub(user.id).sort({ _id: -1 });
    if (checkSub == null) {
        throw new OperationalError_1.OperationalError('you do not have any active subscription', 400);
    }
    return checkSub;
};
CustomerPaymentService._topUpWalletSession = async ({ user, reference }, session) => {
    const paymentVerif = await payments_model_1.PaymentModel.findOne({
        reference: reference,
        user_id: user._id,
        status: 'success',
        is_used: false,
    });
    if (!paymentVerif) {
        throw new OperationalError_1.OperationalError('something went wrong, payement not valid', 400);
    }
    await wallet_model_1.WalletModel.findOneAndUpdate({
        user_id: user._id,
    }, {
        $inc: {
            balance: paymentVerif.amount,
        },
    }, {
        upsert: true,
        session,
    });
    await payments_model_1.PaymentModel.findOneAndUpdate({
        _id: paymentVerif._id,
    }, {
        is_used: true,
        use_case: 'topup',
    }, {
        upsert: true,
        session,
    });
};
CustomerPaymentService.topUpWallet = async (input) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._topUpWalletSession, input);
CustomerPaymentService.fetchWallet = async (user) => {
    const custBalance = await wallet_model_1.WalletModel.find({ user_id: user._id }).select('-__v');
    return custBalance;
};
CustomerPaymentService._redeemGiftCardSession = async ({ user, giftCode }, session) => {
    const giftCard = await giftcard_model_1.GiftCardModel.findOne({
        code: giftCode,
    });
    if (!giftCard) {
        throw new OperationalError_1.OperationalError('invalid gift code entered', 404);
    }
    if (giftCard.used) {
        throw new OperationalError_1.OperationalError('Oops, voucher has been used', 400);
    }
    await wallet_model_1.WalletModel.findOneAndUpdate({
        user_id: user._id,
    }, {
        $inc: {
            balance: giftCard.amount,
        },
    }, {
        upsert: true,
        session,
    });
    giftCard.used = true;
    await giftCard.save({ session });
};
CustomerPaymentService.redeemGiftCard = async (input) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._redeemGiftCardSession, input);
