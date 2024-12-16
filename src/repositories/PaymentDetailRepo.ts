import { PaymentDetailModel } from '../models/paymentDetails.model'

export class PaymentDetailRepo {
  static findOneByUserId = (userId: string) => PaymentDetailModel.findOne({ user_id: userId })
}
