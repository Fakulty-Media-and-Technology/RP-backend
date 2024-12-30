import { PlanModel } from '../../models/plans.model'
import { SubscriptionModel } from '../../models/subscription.model'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { handleDefaultNumAndUnknown } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'

// async function convertToLocalCurrency(usdAmount, userCurrency) {
//   const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`)
//   const data = await response.json()
//   const rate = data.rates[userCurrency]
//   if (!rate) {
//     throw new Error('Currency not supported')
//   }
//   return (usdAmount * rate).toFixed(2)
// }

export class AdminPlanSubController {
  static createPlan = Catch.async(async (req, res) => {
    const admin = GetDefined.loggedInUser(req.user)

    const { title, months: months_duration, price, details } = req.body

    await PlanModel.create({
      title,
      price,
      details,
      months_duration,
      admin_id: admin._id,
    })

    sendResponse({
      res,
      message: 'plan created',
    })
  })

  static updatePlan = Catch.async(async (req, res) => {
    const planUpdate = await PlanModel.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      { $set: req.body },
    )

    if (planUpdate == null) {
      throw new OperationalError('invalid Plan ID', 400)
    }

    sendResponse({
      res,
      message: 'plan updated',
    })
  })

  static fetchPlans = Catch.async(async (_, res) => {
    const plans = await PlanModel.find({ months_duration: { $gt: 0 } }).select('-__v')

    sendResponse({
      res,
      data: plans,
      message: 'plan fetched',
    })
  })

  static fetchSubscriptions = Catch.async(async ({ query }, res) => {
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
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          __v: 0,
        },
      },
    ])

    sendResponse({
      res,
      data: plans,
      message: 'plans fetched',
    })
  })

  static deletePlans = Catch.async(async (req, res) => {
    const deletePlan = await PlanModel.findOneAndDelete({
      _id: req.params.id,
    })

    if (deletePlan == null) {
      throw new OperationalError('plan can not be deleted or not found', 400)
    }

    sendResponse({
      res,
      message: 'plan deleted successfully',
    })
  })
}
