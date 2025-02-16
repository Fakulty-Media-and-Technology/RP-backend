"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPayoutController = void 0;
const payouts_model_1 = require("../../models/payouts.model");
const wallet_model_1 = require("../../models/wallet.model");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
class AdminPayoutController {
}
exports.AdminPayoutController = AdminPayoutController;
_a = AdminPayoutController;
AdminPayoutController.payoutReqAll = Catch_1.Catch.async(async ({ query }, res) => {
    const dbQuery = payouts_model_1.PayoutModel.find({}).sort({ updatedAt: -1 }).populate({
        path: 'processed_by',
        select: 'first_name last_name email',
    });
    const payoutsFeatures = new QueryParamsFeatures_1.QueryParamsFeatures(dbQuery, {
        defaultLimit: 10,
        defaultPage: 1,
        queryParams: query,
    });
    (0, responder_1.sendResponse)({
        res,
        data: await payoutsFeatures.paginate().query,
    });
});
AdminPayoutController.payoutReqOne = Catch_1.Catch.async(async (req, res) => {
    const payout = await payouts_model_1.PayoutModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: [
                        '$_id',
                        {
                            $toObjectId: req.params.id,
                        },
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'client_id',
                foreignField: '_id',
                as: 'user',
                pipeline: [
                    {
                        $project: {
                            first_name: 1,
                            last_name: 1,
                            photo: 1,
                            email: 1,
                            country_code: 1,
                            mobile: 1,
                        },
                    },
                ],
            },
        },
        {
            $set: {
                user: {
                    $first: '$user',
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'processed_by',
                foreignField: '_id',
                as: 'processed_by',
                pipeline: [{ $project: { first_name: 1, last_name: 1, email: 1 } }],
            },
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: payout,
        message: 'payouts fetched',
    });
});
AdminPayoutController.payoutReqGroup = Catch_1.Catch.async(async (_, res) => {
    const payout = await payouts_model_1.PayoutModel.aggregate([
        {
            $match: {
                $expr: {
                // $eq: ["$", ""],
                },
            },
        },
        {
            $group: {
                _id: '$status',
                group: { $push: '$$ROOT' },
            },
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: payout,
        message: 'payout requests grouped',
    });
});
AdminPayoutController._updatePayoutStatusWithSession = async ({ payStatus, payId, adminId }, session) => {
    if (payStatus === 'completed') {
        //debit from client balance
        const payReq = await payouts_model_1.PayoutModel.findById(payId);
        if (payReq === null) {
            throw new OperationalError_1.OperationalError('Payout not found', 40);
        }
        const charges = payReq.charges != null ? payReq.charges : 0;
        await wallet_model_1.WalletModel.findOneAndUpdate({
            user_id: payReq.client_id,
        }, {
            $inc: {
                balance: -Number(payReq.amount + charges),
            },
        }, { upsert: true, session });
    }
    await payouts_model_1.PayoutModel.findByIdAndUpdate(payId, {
        status: payStatus,
        $push: {
            processed_by: adminId,
        },
    }, { upsert: true, session });
};
AdminPayoutController.payoutStatusUpdate = Catch_1.Catch.async(async (req, res) => {
    await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._updatePayoutStatusWithSession, {
        payId: req.params.id,
        adminId: GetDefined_1.GetDefined.loggedInUser(req.user).id,
        payStatus: req.body.status,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'payout status updated',
    });
});
