import { PaymentModel } from '../models/payments.model'
import { skip } from '../utils/QueryParamsFeatures'

export class PaymentRepo {
  static getDeposits = (page: number, limit: number) =>
    PaymentModel.aggregate([
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
        $skip: skip(page, limit),
      },
      {
        $limit: limit,
      },
    ])
}
