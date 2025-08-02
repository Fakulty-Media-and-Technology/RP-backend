import { PaymentModel, PaymentSchema } from '../models/payments.model'
import { MaybeSession } from '../utils/mongoDbSessionRunner'
import { skip } from '../utils/QueryParamsFeatures'

interface UpdatePaymentStatusInput {
  status: PaymentSchema['status']
  session: MaybeSession
  paymentId: string
}
export class PaymentRepo {
  static updatePaymentStatus = ({ paymentId, session, status }: UpdatePaymentStatusInput) =>
    PaymentModel.findByIdAndUpdate(
      paymentId,
      { $set: { status, isUsed: status === 'success' } },
      { session, new: true },
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
