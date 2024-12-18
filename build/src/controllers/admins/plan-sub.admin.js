"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlanSubController = void 0;
const plans_model_1 = require("../../models/plans.model");
const subscription_model_1 = require("../../models/subscription.model");
const catchAsync_1 = require("../../utils/catchAsync");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
// async function convertToLocalCurrency(usdAmount, userCurrency) {
//   const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`)
//   const data = await response.json()
//   const rate = data.rates[userCurrency]
//   if (!rate) {
//     throw new Error('Currency not supported')
//   }
//   return (usdAmount * rate).toFixed(2)
// }
class AdminPlanSubController {
}
exports.AdminPlanSubController = AdminPlanSubController;
_a = AdminPlanSubController;
AdminPlanSubController.createPlan = catchAsync_1.Catch.async(async (req, res) => {
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { title, months, price, details, userCurrency } = req.body;
    if (!months || !title || !price || !details || userCurrency) {
        throw new OperationalError_1.OperationalError('all inputs are required', 400);
    }
    await new plans_model_1.PlanModel({
        admin_id: admin._id,
        title,
        months_duration: Number(months),
        price: Number(price),
        details: details,
    }).save();
    (0, responder_1.sendResponse)({
        res,
        message: 'plan created',
    });
});
AdminPlanSubController.updatePlan = catchAsync_1.Catch.async(async (req, res) => {
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user);
    const id = req.params.id;
    const { title, months, price, details } = req.body;
    const oldValues = await plans_model_1.PlanModel.findOne({
        _id: id,
    });
    if (!oldValues) {
        throw new OperationalError_1.OperationalError('something went wrong, not found', 400);
    }
    await plans_model_1.PlanModel.findOneAndUpdate({
        _id: id,
    }, {
        admin_id: admin._id ? admin._id : oldValues.admin_id,
        title,
        months_duration: months ? Number(months) : oldValues.months_duration,
        price: price ? Number(price) : oldValues.price,
        details: details ? details : oldValues.details,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'plan updated',
    });
});
AdminPlanSubController.fetchPlans = catchAsync_1.Catch.async(async (_, res) => {
    const plans = await plans_model_1.PlanModel.aggregate([
        {
            $match: {
                $expr: {
                    $gt: ['$months_duration', 0],
                },
            },
        },
        {
            $project: {
                __v: 0,
            },
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: plans,
        message: 'plan fetched',
    });
});
AdminPlanSubController.fetchSubscriptions = catchAsync_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const plans = await subscription_model_1.SubscriptionModel.aggregate([
        {
            $match: {},
        },
        {
            $project: {
                __v: 0,
            },
        },
        {
            $lookup: {
                from: 'plans',
                let: {
                    pid: '$plan_id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    '$_id',
                                    {
                                        $toObjectId: '$$pid',
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            title: 1,
                            price: 1,
                            months_duration: 1,
                            description: 1,
                        },
                    },
                ],
                as: 'plan',
            },
        },
        {
            $set: {
                plan: {
                    $first: '$plan',
                },
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $skip: (page - 1) * limit || 0,
        },
        {
            $limit: limit,
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: plans,
        message: 'plans fetched',
    });
});
AdminPlanSubController.deletePlans = catchAsync_1.Catch.async(async (req, res) => {
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user)._id;
    const id = req.params.id;
    const deletePlan = await plans_model_1.PlanModel.findOneAndDelete({
        _id: id,
    });
    if (!deletePlan) {
        throw new OperationalError_1.OperationalError('plan can not be deleted or not found', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'plan deleted successfully',
    });
});
