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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronTaskHandlers = void 0;
const lives_model_1 = require("../models/lives.model");
const paymentDetails_model_1 = require("../models/paymentDetails.model");
const payments_model_1 = require("../models/payments.model");
const plans_model_1 = require("../models/plans.model");
const subscription_model_1 = require("../models/subscription.model");
const videos_model_1 = require("../models/videos.model");
const wallet_model_1 = require("../models/wallet.model");
const paymentIntegration_1 = __importStar(require("../paymentIntegration"));
const UserRepo_1 = require("../repositories/UserRepo");
const emailer_1 = __importDefault(require("../utils/emailer"));
const stringify = (data) => JSON.stringify(data, null, 2);
class CronTaskHandlers {
}
exports.CronTaskHandlers = CronTaskHandlers;
_a = CronTaskHandlers;
CronTaskHandlers.autoRenewSubscriptions = async () => {
    try {
        const now = new Date();
        const updatedExpiredSubsResult = await subscription_model_1.SubscriptionModel.updateMany({
            active: true,
            expiry_date: { $lte: now },
        }, {
            $set: { active: false },
        });
        if (updatedExpiredSubsResult.modifiedCount === 0) {
            console.log('AUTO-RENEW: No Expired Sub');
            return 'no expired sub';
        }
        const expiredSubs = await subscription_model_1.SubscriptionModel.find({
            active: false,
            expiry_date: { $lte: now },
            updatedAt: { $gte: now }, // this gives the most recently updated subs
        });
        if (expiredSubs.length !== updatedExpiredSubsResult.modifiedCount) {
            console.error('AUTO-RENEW: Logical Dev Error in autoRenewSubscription');
            return;
        }
        expiredSubs.forEach(async (sub) => {
            try {
                const customerDetl = await UserRepo_1.UserRepo.getUserById(sub.user_id);
                if (customerDetl === null) {
                    throw new Error(`${sub.user_id} could not be found in autoRenewSubscription cronjob for sub: ${stringify(sub)}`);
                }
                const subPlan = await plans_model_1.PlanModel.findById(sub.plan_id);
                if (subPlan === null) {
                    throw new Error(`${sub.plan_id} could not be found in autoRenewSubscription cronjob for sub: ${stringify(sub)}`);
                }
                const cardDetails = await paymentDetails_model_1.PaymentDetailModel.findOne({
                    user_id: customerDetl._id,
                });
                if (cardDetails === null) {
                    throw new Error(`card details could not be found in autoRenewSubscription cronjob for customer: ${stringify(customerDetl)}`);
                }
                if (cardDetails.authorization_code == null) {
                    throw new Error(`card detials does not have authorization_code in autoRenewSubscription cronjob for. Crad details ${stringify(cardDetails)}`);
                }
                if (cardDetails) {
                    const response = await paymentIntegration_1.default.paystackAuthorizePayment({
                        authorization_code: cardDetails.authorization_code,
                        email: customerDetl.email,
                        amount: subPlan.price,
                        user_id: customerDetl.id,
                        full_name: `${customerDetl.first_name} ${customerDetl.last_name}`,
                    });
                    const { status, amount, metadata, customer, reference } = response.data;
                    const nairaAmount = (0, paymentIntegration_1.convertKoboToNaira)(amount);
                    if (status !== 'success') {
                        const newPayment = new payments_model_1.PaymentModel({
                            user_id: metadata.user_id,
                            full_name: metadata.full_name,
                            email: customer.email,
                            amount: nairaAmount,
                            reference,
                            status,
                        });
                        await newPayment.save();
                        //TODO: send email and push notification here
                        const mailData = {
                            firstName: customerDetl.first_name,
                            lastName: customerDetl.last_name,
                            email: customerDetl.email,
                        };
                        await new emailer_1.default(mailData).sendAutoRenewFailure('unsuccessful attempt to charge your saved card details');
                        console.error('auto-renew subscription request unsuccessfull. Payment details:', stringify(newPayment));
                        return;
                    }
                    const newPayment = new payments_model_1.PaymentModel({
                        user_id: metadata.user_id,
                        full_name: metadata.full_name,
                        email: customer.email,
                        amount: nairaAmount,
                        reference: reference,
                        status: status,
                    });
                    const nPayment = await newPayment.save();
                    await new subscription_model_1.SubscriptionModel({
                        user_id: customerDetl._id,
                        plan_id: subPlan._id,
                        start_date: new Date(),
                        expiry_date: subPlan.getFutureDate(30),
                        payment_method: 'auto-renew',
                        amount: Number(subPlan.price),
                    }).save();
                    await payments_model_1.PaymentModel.findOneAndUpdate({
                        _id: nPayment._id,
                        reference: nPayment.reference,
                    }, {
                        is_used: true,
                        use_case: 'subscription',
                    }, {
                        upsert: true,
                    });
                    //TODO: send successful email and push notification here with reciept
                    const mailData = {
                        firstName: customerDetl.first_name,
                        lastName: customerDetl.last_name,
                        email: customerDetl.email,
                    };
                    await new emailer_1.default(mailData).sendAutoRenewSuccess('saved debit card details');
                    console.log('auto-renew subscription with card success. Payment details:', stringify(nPayment));
                    return;
                }
                // user does not have card details here
                const cusWallet = await wallet_model_1.WalletModel.findOne({
                    user_id: sub.user_id,
                });
                if (cusWallet == null) {
                    throw new Error(`auto-renew: Customer does not have a wallet: ${stringify(customerDetl)}`);
                }
                if (cusWallet.balance < subPlan.price) {
                    //TODO: send email and push
                    const mailData = {
                        firstName: customerDetl.first_name,
                        lastName: customerDetl.last_name,
                        email: customerDetl.email,
                    };
                    await new emailer_1.default(mailData).sendAutoRenewFailure('insufficient wallet balance');
                    console.error(`auto-renew: customer has insufficent balance in wallet: ${stringify(cusWallet)}: sub-plan: ${stringify(subPlan)}`);
                    return;
                }
                await new subscription_model_1.SubscriptionModel({
                    user_id: customerDetl._id,
                    plan_id: subPlan._id,
                    start_date: new Date(),
                    expiry_date: subPlan.getFutureDate(30),
                    payment_method: 'auto-renew',
                    amount: Number(subPlan.price),
                }).save();
                await wallet_model_1.WalletModel.findOneAndUpdate({
                    _id: cusWallet._id,
                    user_id: customerDetl._id,
                }, {
                    $inc: {
                        balance: -Number(subPlan.price),
                    },
                }, {
                    upsert: true,
                });
                //TODO: send email and push
                const mailData = {
                    firstName: customerDetl.first_name,
                    lastName: customerDetl.last_name,
                    email: customerDetl.email,
                };
                await new emailer_1.default(mailData).sendAutoRenewSuccess('wallet balance');
                console.log('sub renewed for customer', stringify(customerDetl));
            }
            catch (e) {
                console.error('Error auto renewing subscription for', stringify(sub));
                console.error('Error details:', e.message ?? e);
            }
        });
    }
    catch (error) {
        console.log('Cron Error: auto-renew', error);
    }
};
CronTaskHandlers.activateLiveStream = async () => {
    try {
        const dateN = Date.now() + 60000 * 30;
        const openClientConnect = await lives_model_1.LiveModel.updateMany({
            start: { $lte: new Date(dateN) },
            active: false,
            expired: false,
        }, {
            $set: { active: true },
        });
        if (openClientConnect.modifiedCount === 0) {
            console.log('No Livestream Time Elapse');
            return;
        }
        console.log('Next Livestream Permission Activated');
    }
    catch (error) {
        console.log('Cron Error: activate livestream', error.message ?? error);
    }
};
CronTaskHandlers.deActivateLiveStream = async () => {
    try {
        const dateN = Date.now();
        const openClientConnect = await lives_model_1.LiveModel.updateMany({
            $and: [{ expiry: { $exists: true } }, { expiry: { $lte: new Date(dateN) } }],
            active: true,
            expired: false,
        }, {
            $set: {
                active: false,
                expired: true,
            },
        });
        if (openClientConnect.modifiedCount === 0) {
            console.log('No Expired Livestream');
            return;
        }
        console.log('Expired Live Event Deactivated');
    }
    catch (error) {
        console.log('Cron Error: deactivate livestream', error.message ?? error);
    }
};
CronTaskHandlers.expireFeaturedContents = async () => {
    try {
        const dateNow = new Date();
        const expiredFeatured = await lives_model_1.LiveModel.updateMany({
            feat_expiry: { $lte: dateNow },
            $and: [{ featured: { $exists: true } }, { featured: true }],
        }, {
            $set: { featured: false },
        });
        if (expiredFeatured.matchedCount === 0) {
            console.log('No Expired Featured Content');
            return;
        }
        const expiredFeaturedVod = await videos_model_1.VideoModel.updateMany({
            feat_expiry: { $lte: dateNow },
            $and: [{ featured: { $exists: true } }, { featured: true }],
        }, { $set: { featured: false } });
        if (expiredFeaturedVod.matchedCount === 0) {
            console.log('No Expired Featured Content');
            return;
        }
        console.log('Expired Featured Contents Expired');
    }
    catch (error) {
        console.log('Cron Error: expire featured content', error.message ?? error);
    }
};
