import { PlanModel } from '../../models/plans.model'
import { SubscriptionModel } from '../../models/subscription.model'
import { Catch } from '../../utils/catchAsync'
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

    const { title, months, price, details, userCurrency } = req.body

    if (!months || !title || !price || !details || userCurrency) {
      throw new OperationalError('all inputs are required', 400)
    }

    await new PlanModel({
      admin_id: admin._id,
      title,
      months_duration: Number(months),
      price: Number(price),
      details: details,
    }).save()

    sendResponse({
      res,
      message: 'plan created',
    })
  })

  static updatePlan = Catch.async(async (req, res) => {
    const admin = GetDefined.loggedInUser(req.user)

    const id = req.params.id

    const { title, months, price, details } = req.body

    const oldValues = await PlanModel.findOne({
      _id: id,
    })

    if (!oldValues) {
      throw new OperationalError('something went wrong, not found', 400)
    }

    await PlanModel.findOneAndUpdate(
      {
        _id: id,
      },
      {
        admin_id: admin._id ? admin._id : oldValues.admin_id,
        title,
        months_duration: months ? Number(months) : oldValues.months_duration,
        price: price ? Number(price) : oldValues.price,
        details: details ? details : oldValues.details,
      },
    )

    sendResponse({
      res,
      message: 'plan updated',
    })
  })

  static fetchPlans = Catch.async(async (_, res) => {
    const plans = await PlanModel.aggregate([
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
    ])

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
    ])

    sendResponse({
      res,
      data: plans,
      message: 'plans fetched',
    })
  })

  static deletePlans = Catch.async(async (req, res) => {
    const admin = GetDefined.loggedInUser(req.user)._id

    const id = req.params.id
    const deletePlan = await PlanModel.findOneAndDelete({
      _id: id,
    })

    if (!deletePlan) {
      throw new OperationalError('plan can not be deleted or not found', 400)
    }

    sendResponse({
      res,
      message: 'plan deleted successfully',
    })
  })
}
