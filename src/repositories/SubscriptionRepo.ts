import { SubscriptionModel } from '../models/subscription.model'

export class SubscriptionRepo {
  static activeSubs = (date: Date) => {
    return SubscriptionModel.find({
      active: true,
      expiry_date: { $lte: date },
    }).countDocuments()
  }

  static findOneActiveUserSub = (userId: string) => {
    return SubscriptionModel.findOne({
      user_id: userId,
      active: true,
      expiry_date: { $gte: new Date() },
    })
  }
}
