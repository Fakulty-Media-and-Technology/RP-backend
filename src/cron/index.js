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
const LivesModel = require("../models/lives.model.js");
const VideosModel = require("../models/videos.model.js");

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
                                             new Date(),
                                             {
                                                  $toDate: "$expiry_date",
                                             },
                                        ],
                                   },
                              ],
                         },
                    },
               },
          ]);

          if (expiredSubs.length === 0) {
               console.log("AUTO-RENEW: No Expired Sub");
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
                    user_id: customerDetl._id,
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
                              firstName: customerDetl.first_name,
                              lastName: customerDetl.last_name,
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
                         user_id: customerDetl._id,
                         plan_id: subPlan._id,
                         start_date: new Date(),
                         expiry_date: futureDate,
                         payment_method: "auto-renew",
                         amount: Number(subPlan.price),
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
                         firstName: customerDetl.first_name,
                         lastName: customerDetl.last_name,
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

               if (Number(cusWallet.balance) < Number(subPlan.price)) {
                    //TODO: send email and push
                    const mailData = {
                         firstName: customerDetl.first_name,
                         lastName: customerDetl.last_name,
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
                    user_id: customerDetl._id,
                    plan_id: subPlan._id,
                    start_date: new Date(),
                    expiry_date: futureDate,
                    payment_method: "auto-renew",
                    amount: Number(subPlan.price),
               }).save();

               await WalletModel.findOneAndUpdate(
                    {
                         _id: cusWallet._id,
                         user_id: customerDetl._id,
                    },
                    {
                         $inc: {
                              balance: -Number(subPlan.price),
                         },
                    },
                    {
                         upsert: true,
                    }
               );

               //TODO: send email and push
               const mailData = {
                    firstName: customerDetl.first_name,
                    lastName: customerDetl.last_name,
                    email: customerDetl.email,
               };

               await new Email(mailData).sendAutoRenewSuccess("wallet balance");

               console.log("sub renewed");
               return "auto renew sub successful";
          }
     } catch (error) {
          console.log("Cron Error: auto-renew", error);
     }
});

// TODO
// cron and deactivate expired livestream
// cron and delete expired video

const activateLiveStream = node_cron.schedule("*/5 * * * *", async () => {
     try {
          const dateN = Date.now() + 60000 * 30;

          const openClientConnect = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $gte: [dateN, "$start"],
                                   },
                                   {
                                        $eq: ["$active", false],
                                   },
                                   {
                                        $eq: ["$expired", false],
                                   },
                              ],
                         },
                    },
               },
          ]);

          if (openClientConnect.length === 0) {
               console.log("No Livestream Time Elapse");
               return;
          }

          Promise.all(
               openClientConnect.map(async (ele) => {
                    await LivesModel.findOneAndUpdate(
                         { _id: ele._id },
                         {
                              active: true,
                         }
                    );
               })
          );

          console.log("Next Livestream Permission Activated");
     } catch (error) {
          console.log("Cron Error: activate livestream", error.message);
     }
});

const deActivateLiveStream = node_cron.schedule("*/5 * * * *", async () => {
     try {
          const dateN = Date.now();

          const openClientConnect = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $ne: [
                                             { $ifNull: ["$expiry", null] },
                                             null,
                                        ],
                                   },
                                   {
                                        $gte: [dateN, "$expiry"],
                                   },
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$expired", false],
                                   },
                              ],
                         },
                    },
               },
          ]);

          if (openClientConnect.length === 0) {
               console.log("No Expired Livestream");
               return;
          }

          Promise.all(
               openClientConnect.map(async (ele) => {
                    await LivesModel.findOneAndUpdate(
                         { _id: ele._id },
                         {
                              active: false,
                              expired: true,
                         }
                    );
               })
          );

          console.log("Expired Live Event Deactivated");
     } catch (error) {
          console.log("Cron Error: deactivate livestream", error.message);
     }
});

const expireFeaturedContents = node_cron.schedule("*/10 * * * *", async () => {
     try {
          const dateNow = new Date();

          const expiredFeatured = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $ne: [
                                             { $ifNull: ["$featured", null] },
                                             null,
                                        ],
                                   },
                                   {
                                        $eq: ["$featured", true],
                                   },
                                   {
                                        $gte: [
                                             dateNow,
                                             {
                                                  $toDate: "$feat_expiry",
                                             },
                                        ],
                                   },
                              ],
                         },
                    },
               },
          ]);

          if (expiredFeatured.length === 0) {
               console.log("No Expired Featured Content");
               return;
          }

          Promise.all(
               expiredFeatured.map(async (ele) => {
                    await LivesModel.findOneAndUpdate(
                         { _id: ele._id },
                         {
                              featured: false,
                         }
                    );
               })
          );

          //VOD
          const expiredFeaturedVod = await VideosModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $ne: [
                                             { $ifNull: ["$featured", null] },
                                             null,
                                        ],
                                   },
                                   {
                                        $eq: ["$featured", true],
                                   },
                                   {
                                        $gte: [
                                             dateNow,
                                             {
                                                  $toDate: "$feat_expiry",
                                             },
                                        ],
                                   },
                              ],
                         },
                    },
               },
          ]);

          if (expiredFeaturedVod.length === 0) {
               console.log("No Expired Featured Content");
               return;
          }

          Promise.all(
               expiredFeaturedVod.map(async (ele) => {
                    await VideosModel.findOneAndUpdate(
                         { _id: ele._id },
                         {
                              featured: false,
                         }
                    );
               })
          );

          console.log("Expired Featured Contents Expired");
     } catch (error) {
          console.log("Cron Error: expire featured content", error.message);
     }
});

module.exports = {
     getActiveSessions,
     autoRenewSubscription,
     activateLiveStream,
     deActivateLiveStream,
     expireFeaturedContents,
};
