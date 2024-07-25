const PaymentsModel = require("../../models/payments.model");
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

exports.createSubscription = async (req, res) => {
     try {
          const user = req.user;

          const { source, reference } = req.body;

          if (!["wallet", "payment"].includes(source)) {
               invalidRequest(
                    res,
                    400,
                    null,
                    "subscription source must be specified: wallet/payment"
               );
          }

          if (source === "wallet") {
          }

          if (source === "payment") {
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
