import { ClientSession } from 'mongoose'
import { PayoutModel } from '../../models/payouts.model'
import { WalletModel } from '../../models/wallet.model'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'

type UpdatePayoutStatusWithSessionInput = {
  payStatus: string
  payId: string
  adminId: string
}

export class AdminPayoutController {
  static payoutReqAll = Catch.async(async ({ query }, res) => {
    const dbQuery = PayoutModel.find({}).sort({ updatedAt: -1 }).populate({
      path: 'processed_by',
      select: 'first_name last_name email',
    })

    const payoutsFeatures = new QueryParamsFeatures(dbQuery, {
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
    const payout = await PayoutModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              '$_id',
              {
                $toObjectId: req.params.id,
              },
            ],
          },
        },
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

  private static _updatePayoutStatusWithSession = async (
    { payStatus, payId, adminId }: UpdatePayoutStatusWithSessionInput,
    session: ClientSession,
  ) => {
    if (payStatus === 'completed') {
      //debit from client balance
      const payReq = await PayoutModel.findById(payId)

      if (payReq === null) {
        throw new OperationalError('Payout not found', 40)
      }

      const charges = payReq.charges != null ? payReq.charges : 0

      await WalletModel.findOneAndUpdate(
        {
          user_id: payReq.client_id,
        },
        {
          $inc: {
            balance: -Number(payReq.amount + charges),
          },
        },
        { upsert: true, session },
      )
    }

    await PayoutModel.findByIdAndUpdate(
      payId,
      {
        status: payStatus,
        $push: {
          processed_by: adminId,
        },
      },
      { upsert: true, session },
    )
  }

  static payoutStatusUpdate = Catch.async(async (req, res) => {
    await withMongoDBSession(this._updatePayoutStatusWithSession, {
      payId: req.params.id,
      adminId: GetDefined.loggedInUser(req.user).id,
      payStatus: req.body.status,
    })

    sendResponse({
      res,
      message: 'payout status updated',
    })
  })
}
