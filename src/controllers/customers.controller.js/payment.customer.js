const UsersModel = require("../../models/users.model");
const PaymentServices = require("../../paymentIntegration");
const {
     serverError,
     successResponse,
} = require("../../utils/response.handler");

exports.startPayment = async (req, res) => {
     try {
          const { email, amount } = req.body;

          const { _id, first_name, last_name } = req.user;

          const response = await PaymentServices.paystackStartPayment({
               email: email,
               amount: amount,
               user_id: _id,
               full_name: `${first_name} ${last_name}`,
          });

          return successResponse(res, 200, response, "payment initiated");
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};

exports.createPayment = async (req, res) => {
     try {
          const { reference } = req.body;

          const response = await PaymentServices.paystackCreatePayment({
               reference,
          });

          return successResponse(res, 200, response, "payment created");
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};

exports.getPaymentReceipt = async (req, res) => {
     try {
          const { reference } = req.query;

          const response = await PaymentServices.paystackPaymentReciept({
               reference,
          });

          return successResponse(res, 200, response, "payment initiated");
     } catch (error) {
          serverError(res, 500, null, error.message);
     }
};
