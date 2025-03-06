"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlanSubController = void 0;
const plans_model_1 = require("../../models/plans.model");
const subscription_model_1 = require("../../models/subscription.model");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
class AdminPlanSubController {
}
exports.AdminPlanSubController = AdminPlanSubController;
_a = AdminPlanSubController;
AdminPlanSubController.createPlan = Catch_1.Catch.async(async (req, res) => {
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { title, months: months_duration, price, details } = req.body;
    await plans_model_1.PlanModel.create({
        title,
        price,
        details,
        months_duration,
        admin_id: admin._id,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'plan created',
    });
});
AdminPlanSubController.updatePlan = Catch_1.Catch.async(async (req, res) => {
    const planUpdate = await plans_model_1.PlanModel.findOneAndUpdate({
        _id: req.params.id,
    }, { $set: req.body });
    if (planUpdate == null) {
        throw new OperationalError_1.OperationalError('invalid Plan ID', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'plan updated',
    });
});
AdminPlanSubController.fetchPlans = Catch_1.Catch.async(async (_, res) => {
    const plans = await plans_model_1.PlanModel.find({ months_duration: { $gt: 0 } }).select('-__v');
    (0, responder_1.sendResponse)({
        res,
        data: plans,
        message: 'plan fetched',
    });
});
AdminPlanSubController.fetchSubscriptions = Catch_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const plans = await subscription_model_1.SubscriptionModel.aggregate([
        {
            $lookup: {
                from: 'plans',
                localField: 'plan_id',
                foreignField: '_id',
                as: 'planRef',
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            price: 1,
                            months_duration: 1,
                            description: 1,
                        },
                    },
                ],
            },
        },
        {
            $set: {
                plan: {
                    $first: '$planRef',
                },
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $skip: (0, QueryParamsFeatures_1.skip)(page, limit),
        },
        {
            $limit: limit,
        },
        {
            $project: {
                planRef: 0,
                __v: 0,
            },
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: plans,
        message: 'plans fetched',
    });
});
AdminPlanSubController.deletePlans = Catch_1.Catch.async(async (req, res) => {
    const deletePlan = await plans_model_1.PlanModel.findOneAndDelete({
        _id: req.params.id,
    });
    if (deletePlan == null) {
        throw new OperationalError_1.OperationalError('plan can not be deleted or not found', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'plan deleted successfully',
    });
});
