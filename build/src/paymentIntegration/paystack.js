"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paystack = void 0;
const paystack_sdk_1 = require("paystack-sdk");
const OperationalError_1 = require("../utils/OperationalError");
const env_1 = __importDefault(require("../env"));
const paystackClient = new paystack_sdk_1.Paystack(env_1.default.PAYSTACK_SECRET_KEY);
class Paystack {
    static async initializePayment(body) {
        const response = await paystackClient.transaction.initialize({
            email: body.email,
            amount: (body.amount * 100).toString(),
            metadata: {
                full_name: body.full_name,
                user_id: body.user_id,
            },
        });
        if (response.data == null || !response.status) {
            console.error(`Paystack Init Error: ${response.message}`);
            throw new OperationalError_1.OperationalError(response.message, 400);
        }
        return response;
        // try {
        //   const metd = JSON.stringify({
        //     full_name: body.full_name,
        //     user_id: body.user_id,
        //   })
        //   const options = {
        //     method: 'POST',
        //     url: 'https://api.paystack.co/transaction/initialize',
        //     headers: {
        //       Authorization: `Bearer ${paySecretKey}`,
        //       'content-type': 'application/json',
        //       'cache-control': 'no-cache',
        //     },
        //     data: {
        //       email: body.email,
        //       amount: body.amount * 100,
        //       metadata: metd,
        //     },
        //   }
        //   const response = await axios.request(options)
        //   return response.data
        // } catch (error) {
        //   console.log(`Paystack Init Error: ${error}`)
        //   return error.message
        // }
    }
    static async authorizePayment(body) {
        const response = await paystackClient.transaction.chargeAuthorization({
            authorization_code: body.authorization_code,
            email: body.email,
            amount: (body.amount * 100).toString(),
        });
        if (response.data == null || !response.status) {
            console.error(`Paystack Charge Authorization Error: ${response.message}`);
            throw new OperationalError_1.OperationalError(response.message, 400);
        }
        return response;
    }
    static async verifyPayment(reference) {
        const response = await paystackClient.transaction.verify(reference);
        if (response.data == null || !response.status) {
            console.error(`Paystack verification Error: ${response.message}`);
            throw new OperationalError_1.OperationalError(response.message, 400);
        }
        return response;
    }
}
exports.Paystack = Paystack;
exports.default = Paystack;
