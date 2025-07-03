import { PaymentModel, PaymentSchema } from '../models/payments.model'
import { MaybeSession } from '../utils/mongoDbSessionRunner'
import { skip } from '../utils/QueryParamsFeatures'

interface UpdatePaymentStatusInput {
  status: PaymentSchema['status']
  session: MaybeSession
  reference: string
}
export class PaymentRepo {
  static updateStatusByReference = ({ reference, session, status }: UpdatePaymentStatusInput) =>
    PaymentModel.findOneAndUpdate(
      { reference },
      { $set: { status, isUsed: status === 'success' } },
      { session },
    )

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
