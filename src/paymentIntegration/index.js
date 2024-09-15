const PaymentDetailsModel = require("../models/paymentDetails.model.js");
const PaymentsModel = require("../models/payments.model");
const Paystack = require("./paystack");

function convertKoboToNaira(kobo) {
     const naira = kobo / 100;
     return naira.toFixed(2);
}

const PaymentServices = {
     async paystackStartPayment(data) {
          try {
               const payment = await Paystack.initializePayment(data);

               return payment;
          } catch (error) {
               console.log(`Payment Init Error: ${error}`);
               return error.message;
          }
     },

     async paystackAuthorizePayment(data) {
          try {
               const payment = await Paystack.authorizePayment(data);

               return payment;
          } catch (error) {
               console.log(`Payment Authorization Error: ${error}`);
               return error.message;
          }
     },

     async paystackCreatePayment(ref, save_card, uid) {
          try {
               const payment = await Paystack.verifyPayment(ref);

               const { amount, reference, status } = payment.data;

               const {
                    authorization_code,
                    last4,
                    brand,
                    exp_month,
                    exp_year,
                    channel,
               } = payment.data.authorization;

               if (save_card && channel === "card" && status === "success") {
                    await PaymentDetailsModel.findOneAndUpdate(
                         {
                              user_id: uid,
                         },
                         {
                              authorization_code,
                              last4,
                              exp_month,
                              exp_year,
                              brand,
                         },
                         {
                              new: true,
                              upsert: true,
                         }
                    );
               }

               const nairaAmount = convertKoboToNaira(amount);

               if (status !== "success") {
                    const newPayment = new PaymentsModel({
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

               const newPayment = new PaymentsModel({
                    user_id: payment.data.metadata.user_id,
                    full_name: payment.data.metadata.full_name,
                    email: payment.data.customer.email,
                    amount: nairaAmount,
                    reference: reference,
                    status: status,
               });

               const nPayment = await newPayment.save();

               return nPayment;
          } catch (error) {
               console.log(`Payment Verification Error: ${error}`);
               return error.message;
          }
     },

     async paystackPaymentReciept({ reference }) {
          try {
               const reciept = await PaymentsModel.findOne({
                    reference: reference,
               });

               return reciept;
          } catch (error) {
               return error.message;
          }
     },
};

module.exports = PaymentServices;
