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
class AdminPayoutController {
}
exports.AdminPayoutController = AdminPayoutController;
_a = AdminPayoutController;
AdminPayoutController.payoutReqAll = Catch_1.Catch.async(async ({ query }, res) => {
    const payoutsFeatures = new QueryParamsFeatures_1.QueryParamsFeatures(payouts_model_1.PayoutModel.find({}).sort({ updatedAt: -1 }), {
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
    const id = req.params.id;
    const payout = await payouts_model_1.PayoutModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: [
                        '$_id',
                        {
                            $toObjectId: id,
                        },
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                let: {
                    uid: '$client_id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    {
                                        $toObjectId: '$_id',
                                    },
                                    {
                                        $toObjectId: '$$uid',
                                    },
                                ],
                            },
                        },
                    },
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
                as: 'user',
            },
        },
        {
            $set: {
                user: {
                    $first: '$user',
                },
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
AdminPayoutController.payoutStatusUpdate = Catch_1.Catch.async(async (req, res) => {
    const id = req.params.id;
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { status } = req.body;
    if (status === 'completed') {
        //debit from client balance
        const payReq = await payouts_model_1.PayoutModel.findById(id);
        if (payReq === null) {
            throw new OperationalError_1.OperationalError('Payout not found', 40);
        }
        const charges = payReq.charges != null ? payReq.charges : 0;
        // TODO: Use session
        await wallet_model_1.WalletModel.findOneAndUpdate({
            user_id: payReq.client_id,
        }, {
            $inc: {
                balance: -Number(payReq.amount + charges),
            },
        }, { upsert: true });
    }
    await payouts_model_1.PayoutModel.findOneAndUpdate({ _id: id }, {
        status: status,
        $push: {
            processed_by: admin._id,
        },
    }, { upsert: true });
    (0, responder_1.sendResponse)({
        res,
        message: 'payout status updated',
    });
});
