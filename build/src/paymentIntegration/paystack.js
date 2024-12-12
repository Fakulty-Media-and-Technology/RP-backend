"use strict";
const axios = require('axios');
const paySecretKey = process.env.PAYSTACK_SECRET_KEY;
const Paystack = {
    async initializePayment(body) {
        try {
            const metd = JSON.stringify({
                full_name: body.full_name,
                user_id: body.user_id,
            });
            const options = {
                method: 'POST',
                url: 'https://api.paystack.co/transaction/initialize',
                headers: {
                    Authorization: `Bearer ${paySecretKey}`,
                    'content-type': 'application/json',
                    'cache-control': 'no-cache',
                },
                data: {
                    email: body.email,
                    amount: body.amount * 100,
                    metadata: metd,
                },
            };
            const response = await axios.request(options);
            return response.data;
        }
        catch (error) {
            console.log(`Paystack Init Error: ${error}`);
            return error.message;
        }
    },
    async authorizePayment(body) {
        try {
            const metd = JSON.stringify({
                full_name: body.full_name,
                user_id: body.user_id,
            });
            const options = {
                method: 'POST',
                url: 'https://api.paystack.co/transaction/charge_authorization',
                headers: {
                    Authorization: `Bearer ${paySecretKey}`,
                    'content-type': 'application/json',
                    'cache-control': 'no-cache',
                },
                data: {
                    authorization_code: body.authorization_code,
                    email: body.email,
                    amount: body.amount * 100,
                    metadata: metd,
                },
            };
            const response = await axios.request(options);
            return response.data;
        }
        catch (error) {
            console.log(`Paystack Init Error: ${error}`);
            return error.message;
        }
    },
    async verifyPayment(reference) {
        try {
            const options = {
                method: 'GET',
                url: `https://api.paystack.co/transaction/verify/${reference}`,
                headers: {
                    Authorization: `Bearer ${paySecretKey}`,
                    'content-type': 'application/json',
                    'cache-control': 'no-cache',
                },
            };
            const response = await axios.request(options);
            return response.data;
        }
        catch (error) {
            console.log(`Paystack Init Error: ${error}`);
            return error.message;
        }
    },
};
module.exports = Paystack;
