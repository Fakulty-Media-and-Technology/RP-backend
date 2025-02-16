"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentDetailRepo = void 0;
const paymentDetails_model_1 = require("../models/paymentDetails.model");
class PaymentDetailRepo {
}
exports.PaymentDetailRepo = PaymentDetailRepo;
PaymentDetailRepo.findOneByUserId = (userId) => paymentDetails_model_1.PaymentDetailModel.findOne({ user_id: userId });
