const PayoutsModel = require("../../models/payouts.model");
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
