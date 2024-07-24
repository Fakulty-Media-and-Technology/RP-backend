const UpcomingModel = require("../../models/upcoming.model");
const { readPhotos } = require("../../services/media-access");
const {
     successResponse,
     serverError,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

exports.upComingFetch = async (req, res) => {
     try {
          let comingSoon = await UpcomingModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: ["$active", true],
                         },
                    },
               },
               {
                    $lookup: {
                         from: "trailers",
                         let: {
                              tid: "$trailer_id",
                         },
                         pipeline: [
                              {
                                   $match: {
                                        $expr: {
                                             $eq: [
                                                  "$_id",
                                                  {
                                                       $toObjectId: "$$tid",
                                                  },
                                             ],
                                        },
                                   },
                              },
                              {
                                   $project: {
                                        __v: 0,
                                   },
                              },
                         ],
                         as: "trailer",
                    },
               },
               {
                    $addFields: {
                         trailer: { $arrayElemAt: ["$trailer", 0] },
                    },
               },
          ]);

          comingSoon = await Promise.all(
               comingSoon.map(async (ele) => {
                    ele.portrait_photo = await readPhotos(
                         ele?.portrait_photo?.Bucket,
                         ele?.portrait_photo?.Key
                    );

                    ele.landscape_photo = await readPhotos(
                         ele?.landscape_photo?.Bucket,
                         ele?.landscape_photo?.Key
                    );

                    return ele;
               })
          );

          return successResponse(
               res,
               200,
               comingSoon,
               "upcoming events fetched"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.upComingSubscribe = async (req, res) => {
     try {
          const upcomingId = req.params.id;

          const user = req.user;

          if (!user._id && user.role === "guest") {
               return invalidRequest(
                    res,
                    403,
                    null,
                    "you are not authenticated"
               );
          }

          const resLikes = await UpcomingModel.findOne({
               _id: upcomingId,
          });

          const userSubscribed = resLikes.reminder.includes(user._id.toString())
               ? true
               : false;

          if (userSubscribed) {
               return invalidRequest(res, 400, null, "user already subscribed");
          }

          await UpcomingModel.findOneAndUpdate(
               {
                    _id: upcomingId,
               },
               {
                    $push: {
                         reminder: user?._id,
                    },
               },
               {
                    upsert: true,
               }
          );

          return successResponse(res, 200, null, "user subscribed to event");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.upComingIsUserSubscribed = async (req, res) => {
     try {
          const upcomingId = req.params.id;

          const user = req.user;

          const resLikes = await UpcomingModel.findOne({
               _id: upcomingId,
          });

          const userSubscribed = resLikes.reminder.includes(user._id.toString())
               ? true
               : false;

          return successResponse(
               res,
               200,
               { user_subscribed: userSubscribed },
               "checks if user alrealdy subscribed"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.upComingUnsubscribe = async (req, res) => {
     try {
          const upcomingId = req.params.id;

          const user = req.user;

          if (!user._id && user.role === "guest") {
               return invalidRequest(
                    res,
                    403,
                    null,
                    "you are not authenticated"
               );
          }

          await UpcomingModel.findOneAndUpdate(
               {
                    _id: upcomingId,
               },
               {
                    $pull: {
                         reminder: user._id,
                    },
               },
               {
                    upsert: true,
               }
          );

          return successResponse(res, 200, null, "user unsubscribed");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
