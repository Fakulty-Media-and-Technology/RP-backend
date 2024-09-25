const LivesModel = require("../../models/lives.model");
const PaymentsModel = require("../../models/payments.model");
const UsersModel = require("../../models/users.model");
const { readPhotos } = require("../../services/media-access");
const crypto = require("crypto");
const {
     serverError,
     successResponse,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

exports.liveStreamCredentials = async (req, res) => {
     try {
          const user = req.user;

          const strm_url = `${process.env.RP_RTMPURL}`; //?email=''&&password=''

          const myStream = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: [
                                             "$client_id",
                                             { $toObjectId: user.id },
                                        ],
                                   },
                                   {
                                        $eq: ["$expired", false],
                                   },
                              ],
                         },
                    },
               },
               {
                    $addFields: {
                         stream_server: strm_url,
                    },
               },
               {
                    $addFields: {
                         stream_url: {
                              $concat: [
                                   process.env.RP_HLSURL,
                                   "$stream_key",
                                   "/index.m3u8",
                              ],
                         },
                    },
               },
               {
                    $sort: {
                         createdAt: -1,
                    },
               },
          ]);

          return successResponse(
               res,
               200,
               myStream,
               "clients stream instances"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

// exports.postPreviewVid = async (req, res) => {
//      try {
//           const { live_id } = req.params;
//           const { video } = req.body;

//           await LivesModel.findOneAndUpdate(
//                {
//                     _id: live_id,
//                },
//                {
//                     preview_video: video,
//                },
//                {
//                     upsert: true,
//                }
//           );

//           return successResponse(res, 200, null, "event preview video posted");
//      } catch (error) {
//           return serverError(res, 500, null, error.message);
//      }
// };

function calcLiveCharges(start, expiry) {
     const startDate = new Date(start).getTime();
     const expiryDate = new Date(expiry).getTime();

     const hoursDifference = (expiryDate - startDate) / (60 * 60000);

     const totalCharge =
          hoursDifference * parseFloat(process.env.EVENT_HOURLY_CHARGES);
     return totalCharge;
}

exports.calculateEventCharges = async (req, res) => {
     try {
          const { start, expiry } = req.query;

          const totalCharge = calcLiveCharges(start, expiry);

          return successResponse(
               res,
               200,
               {
                    estimated_cost: totalCharge,
               },
               "Cost for your event"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

async function genRandUniqId(length) {
     try {
          const chars =
               "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          const charsLength = chars.length;

          const randomBytes = crypto.randomBytes(length);
          let result = "";

          for (let i = 0; i < length; i++) {
               result += chars[randomBytes[i] % charsLength];
          }

          return result;
     } catch (error) {
          console.log(error);
     }
}

exports.createLiveClient = async (req, res) => {
     try {
          const client_id = req.user._id;
          const {
               title,
               sub_title,
               cover_photo,
               vid_class,
               pg,
               category,
               description,
               type,
               start,
               expiry,
               sponsored,
               popular,
               video,
               location,
               payment_id,
          } = req.body;

          if (
               !title ||
               !sub_title ||
               !cover_photo ||
               !vid_class ||
               !pg ||
               !category ||
               !description ||
               !type ||
               !sponsored ||
               !popular ||
               !start ||
               !payment_id ||
               !location
          ) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "all important fields are required"
               );
          }

          const client = await UsersModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: [
                                             "$_id",
                                             {
                                                  $toObjectId: client_id,
                                             },
                                        ],
                                   },
                                   {
                                        $or: [
                                             {
                                                  $eq: ["$role", "channel"],
                                             },
                                             {
                                                  $eq: ["$role", "event"],
                                             },
                                             {
                                                  $eq: ["$role", "podcast"],
                                             },
                                             {
                                                  $eq: ["$role", "tvshow"],
                                             },
                                        ],
                                   },
                              ],
                         },
                    },
               },
          ]);

          const vclient_id = client[0];

          if (!vclient_id) {
               return invalidRequest(res, 400, null, "assigned user not found");
          }

          // const categ = await CategoryEnumModel.findOne({ _id: category });

          // if (!categ) {
          //     return invalidRequest(res, 400, null, "category not found");
          // }

          const confirmPayment = await PaymentsModel.findOne({
               _id: payment_id,
               user_id: vclient_id._id,
               status: "success",
               is_used: false,
          });

          if (!confirmPayment) {
               return failedResponse(res, 400, null, "your payment is invalid");
          }

          const calcCharges = calcLiveCharges(start, expiry);

          if (Number(confirmPayment.amount) !== Number(calcCharges)) {
               return failedResponse(
                    res,
                    200,
                    null,
                    "payment made does not match charges"
               );
          }

          const streamId = await genRandUniqId(12);

          const streamIdExist = await LivesModel.findOne({
               stream_key: streamId,
          });

          if (streamIdExist) {
               return failedResponse(res, 400, null, "Oops, please try again");
          }

          const streamOngoing = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: [
                                             "$client_id",
                                             {
                                                  $toObjectId: client_id,
                                             },
                                        ],
                                   },
                                   {
                                        $eq: ["$active", true],
                                   },
                              ],
                         },
                    },
               },
          ]);

          if (streamOngoing.length > 0) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "client have an ongoing stream"
               );
          }

          const scheduledStream = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: [
                                             "$client_id",
                                             {
                                                  $toObjectId: client_id,
                                             },
                                        ],
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

          if (scheduledStream.length > 0) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "client alrealdy have pending scheduled stream"
               );
          }

          await new LivesModel({
               client_id: vclient_id._id,
               title: title,
               sub_title: sub_title,
               stream_key: streamId,
               cover_photo: cover_photo,
               vid_class: vid_class,
               pg: pg,
               category: category,
               description: description,
               type: type,
               start: new Date(start),
               expiry: new Date(expiry),
               sponsored,
               popular,
               location,
               preview_video: video,
               payment_id: confirmPayment._id,
          }).save();

          await PaymentsModel.findOneAndUpdate(
               {
                    _id: confirmPayment._id,
               },
               {
                    is_used: true,
                    use_case: "live schedule",
               }
          );

          return successResponse(
               res,
               200,
               null,
               "live stream event scheduled, credentials are on attached user dashboard"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
