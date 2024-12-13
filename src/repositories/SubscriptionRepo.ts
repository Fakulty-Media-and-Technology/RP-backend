import { SubscriptionModel } from "../models/subscription.model";

    export class SubscriptionRepo {
      static activeSubs = (date: Date) =>
        SubscriptionModel.find({
          active: true,
          expiry_date: { $lte: date },
        }).countDocuments()
    }