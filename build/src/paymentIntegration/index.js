"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentServices = exports.convertKoboToNaira = void 0;
const paymentDetails_model_1 = require("../models/paymentDetails.model");
const payments_model_1 = require("../models/payments.model");
const paystack_1 = require("./paystack");
const convertKoboToNaira = (kobo) => {
    const naira = kobo / 100;
    return naira.toFixed(2);
};
exports.convertKoboToNaira = convertKoboToNaira;
exports.PaymentServices = {
    async paystackStartPayment(data) {
        return await paystack_1.Paystack.initializePayment(data);
    },
    async paystackAuthorizePayment(data) {
        return await paystack_1.Paystack.authorizePayment(data);
    },
    async paystackCreatePayment(ref, save_card, uid) {
        const payment = await paystack_1.Paystack.verifyPayment(ref);
        const { amount, reference, status, authorization: { authorization_code, last4, brand, exp_month, exp_year, channel }, } = payment.data;
        // TODO: Use Session
        if (save_card && channel === 'card' && status === 'success') {
            await paymentDetails_model_1.PaymentDetailModel.findOneAndUpdate({
                user_id: uid,
            }, {
                authorization_code,
                last4,
                exp_month,
                exp_year,
                brand,
            }, {
                new: true,
                upsert: true,
            });
        }
        const nairaAmount = (0, exports.convertKoboToNaira)(amount);
        if (status !== 'success') {
            const newPayment = new payments_model_1.PaymentModel({
                user_id: payment.data.metadata.user_id,
                full_name: payment.data.metadata.full_name,
                email: payment.data.customer.email,
                amount: nairaAmount,
                reference: reference,
                status: status,
            });
            const nPayment = await newPayment.save();
            return nPayment;
        }
        const newPayment = new payments_model_1.PaymentModel({
            user_id: payment.data.metadata.user_id,
            full_name: payment.data.metadata.full_name,
            email: payment.data.customer.email,
            amount: nairaAmount,
            reference: reference,
            status: status,
        });
        return await newPayment.save();
    },
    async paystackPaymentReciept({ reference }) {
        // TODO: Move to repo layer
        const reciept = await payments_model_1.PaymentModel.findOne({
            reference: reference,
        });
        return reciept;
    },
};
exports.default = exports.PaymentServices;
