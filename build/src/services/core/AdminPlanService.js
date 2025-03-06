"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlanSubService = void 0;
const plans_model_1 = require("../../models/plans.model");
const subscription_model_1 = require("../../models/subscription.model");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
class AdminPlanSubService {
}
exports.AdminPlanSubService = AdminPlanSubService;
_a = AdminPlanSubService;
AdminPlanSubService.createPlan = async (admin, data) => {
    const { title, months: months_duration, price, details } = data;
    await plans_model_1.PlanModel.create({
        title,
        price,
        details,
        months_duration,
        admin_id: admin._id,
    });
};
AdminPlanSubService.updatePlan = async (planId, update) => {
    const planUpdate = await plans_model_1.PlanModel.findByIdAndUpdate(planId, { $set: update });
    if (planUpdate == null) {
        throw new OperationalError_1.OperationalError('invalid Plan ID', 400);
    }
};
AdminPlanSubService.fetchPlans = async (query) => {
    const plansQuery = plans_model_1.PlanModel.find({ months_duration: { $gt: 0 } }).select('-__v');
    return await new QueryParamsFeatures_1.QueryParamsFeatures(plansQuery, {
        defaultLimit: 100,
        defaultPage: 1,
        queryParams: query,
    }).paginate().query;
};
AdminPlanSubService.fetchSubs = async (query) => {
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
    return plans;
};
AdminPlanSubService.deletePlan = async (planId) => {
    const deletePlan = await plans_model_1.PlanModel.findByIdAndDelete(planId);
    if (deletePlan == null) {
        throw new OperationalError_1.OperationalError('plan can not be deleted or not found', 400);
    }
};
