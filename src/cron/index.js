const schedule = require("node-schedule");
const node_cron = require("node-cron");
const { fetchStreamKeys } = require("../livestream/nms");
const SubscriptionModel = require("../models/subscription.model");
const PaymentDetailsModel = require("../models/paymentDetails.model.js");
const UsersModel = require("../models/users.model");
const PaymentServices = require("../paymentIntegration");
const PlansModel = require("../models/plans.model");
const PaymentsModel = require("../models/payments.model");
const WalletModel = require("../models/wallet.model");
const Email = require("../utils/emailer.js");

function convertKoboToNaira(kobo) {
     const naira = kobo / 100;
     return naira.toFixed(2);
}

const getActiveSessions = node_cron.schedule("*/5 * * * *", async () => {
     try {
          // console.log("Active Sessions");
     } catch (error) {
          console.log("Cron Error: active sessions", error.message);
     }
});

const autoRenewSubscription = schedule.scheduleJob("0 0 * * *", async () => {
     try {
          const dateNow = new Date().getTime();

          const expiredSubs = await SubscriptionModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $gte: [
                                             dateNow,
                                             new Date("$expiry_date").getTime(),
                                        ],
                                   },
                              ],
                         },
                    },
               },
          ]);

          if (expiredSubs.length === 0) {
               return "no expired sub";
          }

          for (let sub of expiredSubs) {
               await SubscriptionModel.findOneAndUpdate(
                    {
                         _id: sub._id,
                    },
                    {
                         active: false,
                    },
                    {
                         upsert: true,
                    }
               );
          }

          for (let sub of expiredSubs) {
               const customerDetl = await UsersModel.findOne({
                    _id: sub.user_id,
               });

               const subPlan = await PlansModel.findOne({
                    _id: sub.plan_id,
               });

               const cardDetails = await PaymentDetailsModel.findOne({
                    user_id: customer._id,
               });

               if (cardDetails) {
                    const response =
                         await PaymentServices.paystackAuthorizePayment({
                              authorization_code:
                                   cardDetails.authorization_code,
                              email: customerDetl.email,
                              amount: Number(subPlan.price),
                              user_id: customerDetl._id,
                              full_name: `${customerDetl.first_name} ${customerDetl.last_name}`,
                         });

                    const { status, amount, metadata, customer, reference } =
                         response.data;

                    const nairaAmount = convertKoboToNaira(amount);

                    if (status !== "success") {
                         const newPayment = new PaymentsModel({
                              user_id: metadata.user_id,
                              full_name: metadata.full_name,
                              email: customer.email,
                              amount: nairaAmount,
                              reference: reference,
                              status: status,
                         });
                         await newPayment.save();

                         //TODO: send email and push notification here
                         const mailData = {
                              first_name: customerDetl.first_name,
                              last_name: customerDetl.last_name,
                              email: customerDetl.email,
                         };

                         await new Email(mailData).sendAutoRenewFailure(
                              "unsuccessful attempt to charge your saved card details"
                         );
                         return "auto-renew subscription request unsuccessfull";
                    }

                    const newPayment = new PaymentsModel({
                         user_id: metadata.user_id,
                         full_name: metadata.full_name,
                         email: customer.email,
                         amount: nairaAmount,
                         reference: reference,
                         status: status,
                    });

                    const nPayment = await newPayment.save();

                    const currentDate = new Date();

                    const millisecondsInAMonth = 30 * 24 * 60 * 60 * 1000;

                    const futureDate = new Date(
                         currentDate.getTime() +
                              Number(subPlan.months_duration) *
                                   millisecondsInAMonth
                    );

                    await new SubscriptionModel({
                         user_id: user._id,
                         plan_id: plan_id,
                         start_date: new Date(),
                         expiry_date: futureDate,
                         payment_method: "auto-renew",
                         amount: Number(plan.price),
                    }).save();

                    await PaymentsModel.findOneAndUpdate(
                         {
                              _id: nPayment._id,
                              reference: nPayment.reference,
                         },
                         {
                              is_used: true,
                              use_case: "subscription",
                         },
                         {
                              upsert: true,
                         }
                    );

                    //TODO: send successful email and push notification here with reciept
                    const mailData = {
                         first_name: customerDetl.first_name,
                         last_name: customerDetl.last_name,
                         email: customerDetl.email,
                    };

                    await new Email(mailData).sendAutoRenewSuccess(
                         "saved debit card details"
                    );

                    return "auto-renew subscription request successfull";
               }

               const cusWallet = await WalletModel.findOne({
                    user_id: sub.user_id,
               });

               if (!Number(cusWallet.balance) >= Number(subPlan.price)) {
                    //TODO: send email and push
                    const mailData = {
                         first_name: customerDetl.first_name,
                         last_name: customerDetl.last_name,
                         email: customerDetl.email,
                    };

                    await new Email(mailData).sendAutoRenewFailure(
                         "insufficient wallet balance"
                    );
                    return "insufficient balance";
               }

               const currentDate = new Date();

               const millisecondsInAMonth = 30 * 24 * 60 * 60 * 1000;

               const futureDate = new Date(
                    currentDate.getTime() +
                         Number(subPlan.months_duration) * millisecondsInAMonth
               );

               await new SubscriptionModel({
                    user_id: user._id,
                    plan_id: plan_id,
                    start_date: new Date(),
                    expiry_date: futureDate,
                    payment_method: "auto-renew",
                    amount: Number(plan.price),
               }).save();

               await WalletModel.findOneAndUpdate(
                    {
                         _id: cusWallet._id,
                         user_id: user._id,
                    },
                    {
                         $inc: {
                              balance: -Number(plan.price),
                         },
                    },
                    {
                         upsert: true,
                    }
               );

               //TODO: send email and push
               const mailData = {
                    first_name: customerDetl.first_name,
                    last_name: customerDetl.last_name,
                    email: customerDetl.email,
               };

               await new Email(mailData).sendAutoRenewSuccess("wallet balance");

               return "auto renew sub successful";
          }
     } catch (error) {
          console.log("Cron Error: auto-renew", error.message);
     }
});

// TODO
// cron and deactivate expired livestream
// cron and delete expired video

module.exports = {
     getActiveSessions,
     autoRenewSubscription,
};
