const PayoutsModel = require("../../models/payouts.model");
const WalletModel = require("../../models/wallet.model");
const {
     serverError,
     successResponse,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

exports.reqPayout = async (req, res) => {
     try {
          const user = req.user;
          const { amount, account_number, account_name, bank_name } = req.body;

          if (!amount || !account_name || !account_name || !bank_name) {
               return invalidRequest(res, 400, null, "all input are required");
          }

          const unresolvedPay = await PayoutsModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: [
                                             "$client_id",
                                             {
                                                  $toObjectId: user._id,
                                             },
                                        ],
                                   },
                                   {
                                        $or: [
                                             {
                                                  $eq: ["$status", "pending"],
                                             },
                                             {
                                                  $eq: [
                                                       "$status",
                                                       "processing",
                                                  ],
                                             },
                                        ],
                                   },
                              ],
                         },
                    },
               },
          ]);

          if (unresolvedPay.length !== 0) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "you've already requested for an unresolved payout request"
               );
          }

          const accBal = await WalletModel.findOne({ user_id: user._id });

          if (Number(amount) > Number(accBal.balance)) {
               return failedResponse(res, 400, null, "insufficient balance");
          }

          //check minimum withdrawal
          if (Number(amount) < 50000) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "requested amount is below limit of 50000"
               );
          }

          //remove board charges
          const percent = 15; //todo, admin can always modify
          const finAmount = amount - (Number(amount) * Number(percent)) / 100;

          await new PayoutsModel({
               client_id: user._id,
               amount: finAmount,
               account_number,
               account_name,
               bank_name,
          }).save();

          return successResponse(res, 200, null, "payout request submitted");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.reqPayoutEdit = async (req, res) => {
     try {
          const user = req.user;
          const id = req.params.id;
          const { amount, account_number, account_name, bank_name } = req.body;

          const initVal = await PayoutsModel.findOne({
               _id: id,
               status: "pending",
               client_id: user._id,
          });

          if (!initVal) {
               return failedResponse(
                    res,
                    200,
                    null,
                    "payout request can no longer be modified, it's being processed"
               );
          }

          const accBal = await WalletModel.findOne({ user_id: user._id });

          if (Number(amount) > Number(accBal.balance)) {
               return failedResponse(res, 400, null, "insufficient balance");
          }

          //check minimum withdrawal
          if (Number(amount) < 50000) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "requested amount is below limit of 50000"
               );
          }

          //remove board charges
          const percent = 15;
          const finAmount = amount - (Number(amount) * Number(percent)) / 100;

          await PayoutsModel.findOneAndUpdate(
               {
                    _id: id,
                    client_id: user._id,
               },
               {
                    amount: amount ? finAmount : initVal.amount,
                    account_number: account_number
                         ? account_number
                         : initVal.account_number,
                    account_name: account_name
                         ? account_name
                         : initVal.account_name,
                    bank_name: bank_name ? account_name : initVal.bank_name,
               },
               {
                    upsert: true,
               }
          );

          return successResponse(res, 200, null, "payout request edited");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.payoutReqInfoAll = async (req, res) => {
     try {
          const user = req.user;

          const initVal = await PayoutsModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: [
                                   "$client_id",
                                   {
                                        $toObjectId: user._id,
                                   },
                              ],
                         },
                    },
               },
               {
                    $sort: {
                         updatedAt: -1,
                    },
               },
          ]);

          return successResponse(
               res,
               200,
               initVal,
               "payout requests all history"
          );
     } catch (error) {
          return serverError(res, 400, null, error.message);
     }
};

exports.payoutReqInfoGroup = async (req, res) => {
     try {
          const user = req.user;
          const initVal = await PayoutsModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: [
                                   "$client_id",
                                   {
                                        $toObjectId: user._id,
                                   },
                              ],
                         },
                    },
               },
               {
                    $group: {
                         _id: "$status",
                         group: { $push: "$$ROOT" },
                    },
               },
          ]);

          return successResponse(
               res,
               200,
               initVal,
               "payout requests all grouped"
          );
     } catch (error) {
          return serverError(res, 400, null, error.message);
     }
};
