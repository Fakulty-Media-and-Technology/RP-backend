"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPayoutService = void 0;
const payouts_model_1 = require("../../models/payouts.model");
const wallet_model_1 = require("../../models/wallet.model");
const VideoRepo_1 = require("../../repositories/VideoRepo");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
class AdminPayoutService {
}
exports.AdminPayoutService = AdminPayoutService;
_a = AdminPayoutService;
AdminPayoutService.payOutRequests = async (query) => {
    const payoutQuery = payouts_model_1.PayoutModel.find({}).sort({ updatedAt: -1 }).populate({
        path: 'processed_by',
        select: 'first_name last_name email',
    });
    return await new QueryParamsFeatures_1.QueryParamsFeatures(payoutQuery, {
        defaultLimit: 10,
        defaultPage: 1,
        queryParams: query,
    }).paginate().query;
};
AdminPayoutService.payoutById = async (payoutId) => {
    const payout = await payouts_model_1.PayoutModel.aggregate([
        {
            $match: { _id: (0, VideoRepo_1.toObjectId)(payoutId) },
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
    return payout;
};
AdminPayoutService.payoutGroups = async () => {
    const groups = await payouts_model_1.PayoutModel.aggregate([
        {
            $group: {
                _id: '$status',
                group: { $push: '$$ROOT' },
            },
        },
    ]);
    return groups;
};
AdminPayoutService.updatePayoutStatus = async (input) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._updatePayoutStatusWithSession, input);
AdminPayoutService._updatePayoutStatusWithSession = async ({ payStatus, payId, adminId }, session) => {
    if (payStatus === 'completed') {
        const payout = await payouts_model_1.PayoutModel.findById(payId);
        if (payout === null) {
            throw new OperationalError_1.OperationalError('Payout not found', 40);
        }
        const charges = payout.charges != null ? payout.charges : 0;
        await wallet_model_1.WalletModel.findOneAndUpdate({
            user_id: payout.client_id,
        }, {
            $inc: {
                balance: -Number(payout.amount + charges),
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
