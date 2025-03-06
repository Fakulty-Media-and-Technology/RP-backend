import { PlanModel } from "../../models/plans.model"
import { SubscriptionModel } from "../../models/subscription.model"
import { LoggedInUser } from "../../types"
import { OperationalError } from "../../utils/OperationalError"
import { ExpressRequestQuery, QueryParamsFeatures, handleDefaultNumAndUnknown, skip } from "../../utils/QueryParamsFeatures"

export class AdminPlanSubService {
  static createPlan = async (admin: LoggedInUser, data: Record<string, any>) => {
    const { title, months: months_duration, price, details } = data

    await PlanModel.create({
      title,
      price,
      details,
      months_duration,
      admin_id: admin._id,
    })
  }

  static updatePlan = async (planId: string, update: Record<string, any>) => {
    const planUpdate = await PlanModel.findByIdAndUpdate(planId, { $set: update })

    if (planUpdate == null) {
      throw new OperationalError('invalid Plan ID', 400)
    }
  }

  static fetchPlans = async (query: ExpressRequestQuery) => {
    const plansQuery = PlanModel.find({ months_duration: { $gt: 0 } }).select('-__v')

    return await new QueryParamsFeatures(plansQuery, {
      defaultLimit: 100,
      defaultPage: 1,
      queryParams: query,
    }).paginate().query
  }

  static fetchSubs = async (query: ExpressRequestQuery) => {
    const limit = handleDefaultNumAndUnknown(query.limit, 10)
    const page = handleDefaultNumAndUnknown(query.page, 1)

    const plans = await SubscriptionModel.aggregate([
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
        $skip: skip(page, limit),
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
    ])

    return plans
  }

  static deletePlan = async (planId: string) => {
    const deletePlan = await PlanModel.findByIdAndDelete(planId)

    if (deletePlan == null) {
      throw new OperationalError('plan can not be deleted or not found', 400)
    }
  }
}
