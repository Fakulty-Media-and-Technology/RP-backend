"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRepo = void 0;
const subscription_model_1 = require("../models/subscription.model");
class SubscriptionRepo {
}
exports.SubscriptionRepo = SubscriptionRepo;
SubscriptionRepo.activeSubs = (date) => {
    return subscription_model_1.SubscriptionModel.find({
        active: true,
        expiry_date: { $lte: date },
    }).countDocuments();
};
SubscriptionRepo.findOneActiveUserSub = (userId) => {
    return subscription_model_1.SubscriptionModel.findOne({
        user_id: userId,
        active: true,
        expiry_date: { $gte: new Date() },
    });
};
