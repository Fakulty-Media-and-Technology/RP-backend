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

     async paystackCreatePayment(ref) {
          try {
               const payment = await Paystack.verifyPayment(ref);

               const { amount, reference, status } = payment.data;

               if (status !== "success") {
                    return "payment unsuccessful";
               }

               const nairaAmount = convertKoboToNaira(amount);

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
               console.log(`Payment Init Error: ${error}`);
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
               console.log(`Payment Init Error: ${error}`);
               return error.message;
          }
     },
};

module.exports = PaymentServices;
