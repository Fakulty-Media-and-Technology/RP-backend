import { ClientSession } from 'mongoose'
import { PayoutModel } from '../../models/payouts.model'
import { WalletModel } from '../../models/wallet.model'
import { toObjectId } from '../../repositories/VideoRepo'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'

type UpdatePayoutStatusWithSessionInput = {
  payStatus: string
  payId: string
  adminId: string
}

export class AdminPayoutService {
  static payOutRequests = async (query: ExpressRequestQuery) => {
    const payoutQuery = PayoutModel.find({}).sort({ updatedAt: -1 }).populate({
      path: 'processed_by',
      select: 'first_name last_name email',
    })

    return await new QueryParamsFeatures(payoutQuery, {
      defaultLimit: 10,
      defaultPage: 1,
      queryParams: query,
    }).paginate().query
  }

  static payoutById = async (payoutId: string) => {
    const payout = await PayoutModel.aggregate([
      {
        $match: { _id: toObjectId(payoutId) },
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

    return payout
  }

  static payoutGroups = async () => {
    const groups = await PayoutModel.aggregate([
      {
        $group: {
          _id: '$status',
          group: { $push: '$$ROOT' },
        },
      },
    ])

    return groups
  }

  static updatePayoutStatus = async (input: UpdatePayoutStatusWithSessionInput) =>
    await withMongoDBSession(this._updatePayoutStatusWithSession, input)

  private static _updatePayoutStatusWithSession = async (
    { payStatus, payId, adminId }: UpdatePayoutStatusWithSessionInput,
    session: MaybeSession,
  ) => {
    if (payStatus === 'completed') {
      const payout = await PayoutModel.findById(payId)

      if (payout === null) {
        throw new OperationalError('Payout not found', 40)
      }

      const charges = payout.charges != null ? payout.charges : 0

      await WalletModel.findOneAndUpdate(
        {
          user_id: payout.client_id,
        },
        {
          $inc: {
            balance: -Number(payout.amount + charges),
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
}
