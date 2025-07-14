import { PaymentDetailModel } from '../models/paymentDetails.model'
import { StringOrObjectId } from '../types'

export class PaymentDetailRepo {
  static findOneById = (paymentDetailsId: StringOrObjectId) =>
    PaymentDetailModel.findById(paymentDetailsId)

  static findManyByUserId = (userId: string) => PaymentDetailModel.find({ userId })
}
