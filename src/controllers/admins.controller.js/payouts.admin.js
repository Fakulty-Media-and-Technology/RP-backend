const PayoutsModel = require("../../models/payouts.model");
const WalletModel = require("../../models/wallet.model");
const {
     serverError,
     successResponse,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

exports.payoutReqAll = async (req, res) => {
     try {
          const initVal = await PayoutsModel.aggregate([
               {
                    $match: {
                         $expr: {},
                    },
               },
               {
                    $sort: {
                         updatedAt: -1,
                    },
               },
          ]);

          return successResponse(res, 200, initVal, "payout requests all");
     } catch (error) {
          return serverError(res, 400, null, error.message);
     }
};

exports.payoutReqGroup = async (req, res) => {
     try {
          const initVal = await PayoutsModel.aggregate([
               {
                    $match: {
                         $expr: {
                              // $eq: ["$", ""],
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

          return successResponse(res, 200, initVal, "payout requests grouped");
     } catch (error) {
          return serverError(res, 400, null, error.message);
     }
};

// exports.payoutStartPayment = async (req, res) => {
//      try {
//           const id = req.params.id;
//           await PayoutsModel.findOneAndUpdate(
//                { _id: id },
//                { status: "processing" },
//                { upsert: true }
//           );

//           return successResponse(res, 200, null, "payout processing started");
//      } catch (error) {
//           return serverError(res, 400, null, error.message);
//      }
// };

exports.payoutStatusUpdate = async (req, res) => {
     try {
          const id = req.params.id;
          const admin = req.user;
          const { status } = req.body;

          if (status === "completed") {
               //debit from client balance
               const payReq = await PayoutsModel.findOne({
                    _id: id,
               });

               await WalletModel.findOneAndUpdate(
                    {
                         user_id: payReq.client_id,
                    },
                    {
                         $inc: {
                              balance: -Number(payReq.amount + payReq.charges),
                         },
                    },
                    { upsert: true }
               );
          }

          await PayoutsModel.findOneAndUpdate(
               { _id: id },
               {
                    status: status,
                    $push: {
                         processed_by: admin._id,
                    },
               },
               { upsert: true }
          );

          return successResponse(res, 200, null, "payout status updated");
     } catch (error) {
          return serverError(res, 400, null, error.message);
     }
};
