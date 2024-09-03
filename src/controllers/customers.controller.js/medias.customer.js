const path = require("path");
const {
     createTranscodingJob,
     readPhotos,
     getVideoUrl,
} = require("../../services/media-access");
const { uploadImage } = require("../../services/media-management");
const {
     successResponse,
     serverError,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

const {
     S3Client,
     GetObjectCommand,
     ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getSignedUrl: getCFSignedUrl } = require("@aws-sdk/cloudfront-signer");
const UserSettingsModel = require("../../models/userSettings.model");
const LivesModel = require("../../models/lives.model");
const VideosModel = require("../../models/videos.model");

exports.uploadImageRoute = async (req, res) => {
     try {
          const user = req.user;
          if (!user._id && user.role === "guest") {
               return invalidRequest(
                    res,
                    403,
                    null,
                    "you are not authenticated"
               );
          }

          const { fileName, fileHandle } = req.body;

          const image = await uploadImage(req, fileHandle, fileName);

          return successResponse(res, 200, image, "image uploaded");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.customerGetPhotoUrl = async (req, res) => {
     try {
          // const user = req.user;

          // if(!user._id && user.role === "guest") {
          //     return invalidRequest(res, 403, null, "you are not authenticated")
          // }

          const { bucket, key } = req.body;

          const image = await readPhotos(bucket, key);

          return successResponse(res, 200, image, "image fetched");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

const s3Client = new S3Client({
     region: process.env.S3REGION,
     credentials: {
          accessKeyId: process.env.S3ACCESS_KEY,
          secretAccessKey: process.env.S3SECRET_KEY,
     },
});

exports.vodStream = async (req, res) => {
     try {
          const { bucket, key } = req.body;
          const user = req.user;

          const transPath = `s3://reeplay/transcode/${key.split("/").slice(1).join("/")}`;

          const params = {
               Bucket: bucket,
               Prefix: `transcode/${key.split("/").slice(1).join("/")}/`,
               MaxKeys: 1,
          };

          const data = await s3Client.send(new ListObjectsV2Command(params));

          // console.log(data.Contents);
          const checkTranscodedFolder = data.Contents?.length > 0;

          if (checkTranscodedFolder != true) {
               // const url = await getVideoUrl(bucket, key);
               // console.log(url);

               const filePath = `s3://reeplay/${key}`;

               await createTranscodingJob(filePath, transPath);

               return failedResponse(
                    res,
                    500,
                    null,
                    "Oops, check back in few minutes, wait while the video is being transcoded"
               );
          }
          console.log("all good, video already trancoded");

          const user_resolution = await UserSettingsModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: ["$user_id", { $toObjectId: user.id }],
                         },
                    },
               },
          ]);

          const userRes = user_resolution[0].video_quality || "480p";

          const url = `${process.env.CFSDISTRIBUTION}/${key
               .split("/")
               .slice(1)
               .join("/")}/${key.split("/").slice(1).join("/")}_${userRes}.mp4`;

          const privateKey = (process.env.CFS_PRIVATE_KEY ?? "").replaceAll(
               /\\n/g,
               "\n"
          );

          const expirationDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

          // access transcoded files with cloudfront
          const signedUrl = getCFSignedUrl({
               url: url,
               keyPairId: process.env.KEY_PAIR_ID,
               dateLessThan: expirationDate.toISOString(),
               privateKey: privateKey,
          });

          return successResponse(
               res,
               200,
               {
                    video_content: signedUrl,
               },
               "video streaming"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.likeVideo = async (req, res) => {
     try {
          const streamId = req.params.id;

          const user = req.user;

          const resLikes = await VideosModel.findOne({
               _id: streamId,
          });

          if (!user._id && user.role === "guest") {
               return invalidRequest(
                    res,
                    403,
                    null,
                    "you are not authenticated"
               );
          }

          if (resLikes.likes.includes(user._id.toString())) {
               return invalidRequest(res, 400, null, "user already liked");
          }

          await VideosModel.findOneAndUpdate(
               {
                    _id: streamId,
               },
               {
                    $push: {
                         likes: user?._id,
                    },
               }
          );

          return successResponse(res, 200, null, "video liked");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.userLikedVideo = async (req, res) => {
     try {
          const streamId = req.params.id;

          const user = req.user;

          const resLikes = await VideosModel.findOne({
               _id: streamId,
          });

          const userLiked = resLikes.likes.includes(user._id.toString())
               ? true
               : false;

          return successResponse(
               res,
               200,
               { user_liked: userLiked },
               "checks if user alrealdy liked"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.unLikeVideo = async (req, res) => {
     try {
          const streamId = req.params.id;

          const user = req.user;

          if (!user._id && user.role === "guest") {
               return invalidRequest(
                    res,
                    403,
                    null,
                    "you are not authenticated"
               );
          }

          await VideosModel.findOneAndUpdate(
               {
                    _id: streamId,
               },
               {
                    $pull: {
                         likes: user._id,
                    },
               }
          );

          return successResponse(res, 200, null, "video unliked");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEvents = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: ["$active", true],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                         start: 1,
                         expiry: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(res, 200, liveEvents, "live events fetched");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsSponsored = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: ["$sponsored", true],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: sponsored events"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsChannels = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "channel"],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: channels"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsChannelsPop = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "channel"],
                                   },
                                   {
                                        $eq: ["$popular", true],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: popular channels"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsEven = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "events"],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: events"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsEvenPop = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "events"],
                                   },
                                   {
                                        $eq: ["$popular", true],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: popular events"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsTvshow = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "tvshow"],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: tvshow"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsTvshowPop = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "tvshow"],
                                   },
                                   {
                                        $eq: ["$popular", true],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: popular tvshow"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsSports = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "sports"],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: sports"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsSportsPop = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "sports"],
                                   },
                                   {
                                        $eq: ["$popular", true],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: popular sports"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsPodcast = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "podcast"],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: podcasts"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.getLiveEventsPodcastPop = async (req, res) => {
     try {
          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: ["$active", true],
                                   },
                                   {
                                        $eq: ["$type", "podcast"],
                                   },
                                   {
                                        $eq: ["$popular", true],
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          for (let event of liveEvents) {
               if (
                    event.cover_photo &&
                    event.cover_photo.Bucket &&
                    event.cover_photo.Key
               ) {
                    const signedUrl = await readPhotos(
                         event.cover_photo.Bucket,
                         event.cover_photo.Key
                    );
                    event.photo_url =
                         signedUrl.status == 400 ? "no picture" : signedUrl;
               } else {
                    event.photo_url = "no picture";
               }
          }

          return successResponse(
               res,
               200,
               liveEvents,
               "live events fetched: popular podcasts"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.streamLiveEvent = async (req, res) => {
     try {
          const streamId = req.params.id;

          const liveEvents = await LivesModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $and: [
                                   {
                                        $eq: [
                                             "$_id",
                                             {
                                                  $toObjectId: streamId,
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
               {
                    $project: {
                         title: 1,
                         sub_title: 1,
                         cover_photo: 1,
                         stream_key: 1,
                         vid_class: 1,
                         pg: 1,
                         category: 1,
                         description: 1,
                         type: 1,
                         participants: 1,
                    },
               },
          ]);

          const stream_url = `${process.env.RP_HLSURL}${liveEvents[0]?.stream_key}/index.m3u8`;

          liveEvents[0].stream_key = null;

          return successResponse(
               res,
               200,
               {
                    live_data: liveEvents[0],
                    url: stream_url,
               },
               "live events fetched"
          );
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
