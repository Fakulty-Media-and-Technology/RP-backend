const GiftcardModel = require("../../models/giftcard.model");
const PaymentsModel = require("../../models/payments.model");
const PlansModel = require("../../models/plans.model");
const SubscriptionModel = require("../../models/subscription.model");
const UsersModel = require("../../models/users.model");
const WalletModel = require("../../models/wallet.model");
const PaymentServices = require("../../paymentIntegration");
const {
     serverError,
     successResponse,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

exports.startPayment = async (req, res) => {
     try {
          const { email, amount } = req.body;

          const { _id, first_name, last_name } = req.user;

          const response = await PaymentServices.paystackStartPayment({
               email: email,
               amount: amount,
               user_id: _id,
               full_name: `${first_name} ${last_name}`,
          });

          return successResponse(res, 200, response, "payment initiated");
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};

exports.createPayment = async (req, res) => {
     try {
          const { reference } = req.body;

          const response = await PaymentServices.paystackCreatePayment({
               reference,
          });

          return successResponse(res, 200, response, "payment created");
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};

exports.getPaymentReceipt = async (req, res) => {
     try {
          const { reference } = req.query;

          const response = await PaymentServices.paystackPaymentReciept({
               reference,
          });

          return successResponse(res, 200, response, "payment initiated");
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};

exports.fetchPlans = async (req, res) => {
     try {
          const plans = await PlansModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $gt: ["$months_duration", 0],
                         },
                    },
               },
               {
                    $project: {
                         __v: 0,
                    },
               },
          ]);

          return successResponse(res, 200, plans, "plan fetched");
     } catch (error) {
          serverError(req, 500, null, error.message);
     }
};

exports.createSubscription = async (req, res) => {
     try {
          const user = req.user;

          const { source, plan_id, reference } = req.body;

          if (!["wallet", "payment"].includes(source)) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "subscription source must be specified: wallet/payment"
               );
          }

          const checkSub = await SubscriptionModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$user_id", user._id],
                                   },
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $gte: ["$expiry_date", new Date()],
                                   },
                              ],
                         },
                    },
               },
          ]);

          if (checkSub[0] || checkSub.length > 0) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "you still have an active subscription"
               );
          }

          if (source === "wallet") {
               const cusWallet = await WalletModel.findOne({
                    user_id: user._id,
               });

               const plan = await PlansModel.findOne({
                    _id: plan_id,
               });

               if (!Number(cusWallet.balance) >= Number(plan.price)) {
                    return failedResponse(
                         res,
                         400,
                         null,
                         "insufficient balance"
                    );
               }

               const currentDate = new Date();

               const millisecondsInAMonth = 30 * 24 * 60 * 60 * 1000;

               const futureDate = new Date(
                    currentDate.getTime() +
                         Number(plan.months_duration) * millisecondsInAMonth
               );

               await new SubscriptionModel({
                    user_id: user._id,
                    plan_id: plan_id,
                    start_date: new Date(),
                    expiry_date: futureDate,
                    payment_method: "wallet",
                    amount: Number(plan.price),
               }).save();

               await WalletModel.findOneAndUpdate(
                    {
                         _id: cusWallet._id,
                         user_id: user._id,
                    },
                    {
                         $inc: {
                              balance: -Number(plan.price),
                         },
                    },
                    {
                         upsert: true,
                    }
               );

               return successResponse(
                    res,
                    200,
                    null,
                    "subscription created successfully from wallet"
               );
          }

          if (source === "payment") {
               return successResponse(
                    res,
                    200,
                    null,
                    "not yet implemented"
                    // "subscription created successfully by direct payment"
               );
          }
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};

exports.topupWallet = async (req, res) => {
     try {
          const user = req.user;

          const { reference } = req.body;

          const paymentVerif = await PaymentsModel.findOne({
               reference: reference,
               user_id: user._id,
               status: "success",
               is_used: false,
          });

          if (!paymentVerif) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "something went wrong, payement not valid"
               );
          }

          await WalletModel.findOneAndUpdate(
               {
                    user_id: user._id,
               },
               {
                    $inc: {
                         balance: Number(paymentVerif.amount),
                    },
               },
               {
                    upsert: true,
                    new: true,
               }
          );

          await PaymentsModel.findOneAndUpdate(
               {
                    _id: paymentVerif._id,
               },
               {
                    is_used: true,
                    use_case: "topup",
               },
               {
                    upsert: true,
               }
          );

          return successResponse(res, 200, null, "wallet topped up");
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};

exports.fetchWallet = async (req, res) => {
     try {
          const user = req.user;

          const custBalance = await WalletModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: ["$user_id", user._id],
                         },
                    },
               },
               {
                    $project: {
                         __v: 0,
                    },
               },
          ]);

          return successResponse(res, 200, custBalance, "user wallet info");
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};

exports.redeemGiftCard = async (req, res) => {
     try {
          const user = req.user;

          const { gift_code } = req.query;

          const checkValidity = await GiftcardModel.findOne({
               code: gift_code,
          });

          if (!checkValidity) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "invalid gift code entered"
               );
          }

          const isUsed = await GiftcardModel.findOne({
               code: gift_code,
               used: false,
          });

          if (!isUsed) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "Oops, voucher has been used"
               );
          }

          await WalletModel.findOneAndUpdate(
               {
                    user_id: user._id,
               },
               {
                    $inc: {
                         balance: Number(isUsed.amount),
                    },
               },
               {
                    upsert: true,
               }
          );

          await GiftcardModel.findOneAndUpdate(
               {
                    _id: isUsed._id,
                    code: gift_code,
               },
               {
                    used: true,
               },
               {
                    upsert: true,
               }
          );

          return successResponse(
               res,
               200,
               null,
               "giftcard has been redeemed and credited to your wallet successfully"
          );
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};
