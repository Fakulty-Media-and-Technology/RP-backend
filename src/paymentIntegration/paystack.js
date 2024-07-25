const axios = require("axios");

const paySecretKey = process.env.PAYSTACK_SECRET_KEY;

const Paystack = {
     async initializePayment(body) {
          try {
               const metd = JSON.stringify({
                    full_name: body.full_name,
                    user_id: body.user_id,
               });

               const options = {
                    method: "POST",
                    url: "https://api.paystack.co/transaction/initialize",
                    headers: {
                         Authorization: `Bearer ${paySecretKey}`,
                         "content-type": "application/json",
                         "cache-control": "no-cache",
                    },
                    data: {
                         email: body.email,
                         amount: body.amount * 100,
                         metadata: metd,
                    },
               };

               const response = await axios.request(options);

               return response.data;
          } catch (error) {
               console.log(`Payment Init Error: ${error}`);
               return error.message;
          }
     },

     async verifyPayment(ref) {
          const options = {
               method: "GET",
               url: `https://api.paystack.co/transaction/verify/:${ref}`,
               headers: {
                    Authorization: `Bearer ${paySecretKey}`,
                    "content-type": "application/json",
                    "cache-control": "no-cache",
               },
          };

          const response = await axios.request(options);

          return response.data;
     },
};

module.exports = Paystack;
