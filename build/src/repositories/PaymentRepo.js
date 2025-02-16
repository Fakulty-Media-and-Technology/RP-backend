"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepo = void 0;
const payments_model_1 = require("../models/payments.model");
const QueryParamsFeatures_1 = require("../utils/QueryParamsFeatures");
class PaymentRepo {
}
exports.PaymentRepo = PaymentRepo;
PaymentRepo.getDeposits = (page, limit) => payments_model_1.PaymentModel.aggregate([
    {
        $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'client',
            pipeline: [
                {
                    $match: {
                        role: { $in: ['tvshow', 'channel', 'podcast', 'event'] },
                    },
                },
                {
                    $project: {
                        role: 1,
                    },
                },
            ],
        },
    },
    {
        $match: {
            client: { $ne: [] },
        },
    },
    {
        $skip: (0, QueryParamsFeatures_1.skip)(page, limit),
    },
    {
        $limit: limit,
    },
]);
