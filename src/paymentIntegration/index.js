const PaymentsModel = require("../models/payments.model");
const Paystack = require("./paystack");

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

               const { amount, reference, status } = payment;

               const newPayment = new PaymentsModel({
                    user_id: payment.metadata.userId,
                    email: payment.customer.email,
                    amount: amount,
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

     async paystackPaymentReciept(ref) {
          try {
               const reciept = await PaymentsModel.findOne({ reference: ref });

               return reciept;
          } catch (error) {
               console.log(`Payment Init Error: ${error}`);
               return error.message;
          }
     },
};

module.exports = PaymentServices;
