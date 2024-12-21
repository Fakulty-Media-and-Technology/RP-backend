import { PayoutModel } from '../../models/payouts.model'
import { WalletModel } from '../../models/wallet.model'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'

export class AdminPayoutController {
  static payoutReqAll = Catch.async(async ({ query }, res) => {
    const payoutsFeatures = new QueryParamsFeatures(PayoutModel.find({}).sort({ updatedAt: -1 }), {
      defaultLimit: 10,
      defaultPage: 1,
      queryParams: query,
    })

    sendResponse({
      res,
      data: await payoutsFeatures.paginate().query,
    })
  })

  static payoutReqOne = Catch.async(async (req, res) => {
    const id = req.params.id

    const payout = await PayoutModel.aggregate([
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
    ])

    sendResponse({
      res,
      data: payout,
      message: 'payouts fetched',
    })
  })

  static payoutReqGroup = Catch.async(async (_, res) => {
    const payout = await PayoutModel.aggregate([
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
    ])

    sendResponse({
      res,
      data: payout,
      message: 'payout requests grouped',
    })
  })

  static payoutStatusUpdate = Catch.async(async (req, res) => {
    const id = req.params.id
    const admin = GetDefined.loggedInUser(req.user)
    const { status } = req.body

    if (status === 'completed') {
      //debit from client balance
      const payReq = await PayoutModel.findById(id)

      if(payReq === null){
        throw new OperationalError('Payout not found', 40)
      }

      const charges = payReq.charges != null ? payReq.charges : 0

      // TODO: Use session

      await WalletModel.findOneAndUpdate(
        {
          user_id: payReq.client_id,
        },
        {
          $inc: {
            balance: -Number(payReq.amount + charges),
          },
        },
        { upsert: true },
      )
    }

    await PayoutModel.findOneAndUpdate(
      { _id: id },
      {
        status: status,
        $push: {
          processed_by: admin._id,
        },
      },
      { upsert: true },
    )

    sendResponse({
      res,
      message: 'payout status updated',
    })
  })
}
