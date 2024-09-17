const CategoryEnumModel = require("../../models/categoryEnum.model");
const LivesModel = require("../../models/lives.model");
const PosterModel = require("../../models/poster.model");
const SubtitleModel = require("../../models/subtitle.model");
const TrailerModel = require("../../models/trailer.model");
const UsersModel = require("../../models/users.model");
const VideosModel = require("../../models/videos.model");
const { readPhotos } = require("../../services/media-access");
const {
     uploadLargeVideos,
     uploadShortVideos,
     uploadImage,
     uploadSubtitle,
} = require("../../services/media-management");
const {
     serverError,
     successResponse,
     invalidRequest,
     failedResponse,
} = require("../../utils/response.handler");
const crypto = require("crypto");

exports.uploadLargeVideoRoute = async (req, res) => {
     res.setHeader("Content-Type", "text/event-stream");
     res.setHeader("Cache-Control", "no-cache");
     res.setHeader("Connection", "keep-alive");
     res.flushHeaders();

     try {
          const user = req.user;

          const { fileName, fileHandle, expire } = req.body;

          const video = await uploadLargeVideos(
               req,
               fileHandle,
               fileName,
               expire,
               res
          );
          // console.log(video);
          // return successResponse(res, 200, video, "video uploaded");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

//can be used for any video less than 5mb
exports.uploadShortVideoRoute = async (req, res) => {
     try {
          const user = req.user;

          const { fileName, fileHandle, expire } = req.body;

          const video = await uploadShortVideos(
               req,
               fileHandle,
               expire,
               fileName
          );

          return successResponse(res, 200, video, "short video uploaded");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.uploadVidSubtitle = async (req, res) => {
     try {
          const user = req.user;

          const { fileName, fileHandle } = req.body;
          console.log(req.body);
          const video = await uploadSubtitle(req, fileHandle, fileName);

          return successResponse(res, 200, video, "video subtitle uploaded");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.uploadImageRoute = async (req, res) => {
     try {
          const user = req.user;

          const { fileName, fileHandle } = req.body;

          const image = await uploadImage(req, fileHandle, fileName);

          return successResponse(res, 200, image, "image uploaded");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.adminGetPhotoUrl = async (req, res) => {
     try {
          const user = req.user;

          const { bucket, key } = req.body;

          const image = await readPhotos(bucket, key);

          return successResponse(res, 200, image, "image fetched");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

// //Videos CRUD for both vod and live
// exports.createVideo = async (req, res) => {
//      try {
//           const user = req.user;
//           const {
//                title,
//                type,
//                key,
//                description,
//                vid_class,
//                pg,
//                genre,
//                category,
//                released_date,
//                expiry_date,
//                trailer_data,
//                poster1_data,
//                poster2_data,
//           } = req.body;

//           const vidDb = await new VideosModel({ admin_id: user._id }).save();

//           if (!poster1_data.key || !poster1_data.dimension) {
//                return invalidRequest(
//                     res,
//                     400,
//                     null,
//                     "poster file(key) and orientation is required"
//                );
//           }

//           await new PosterModel({
//                video_id: vidDb._id,
//                key: poster1_data.key,
//                dimension: poster1_data.dimension,
//           }).save();

//           if (!poster2_data.key || !poster2_data.dimension) {
//                return invalidRequest(
//                     res,
//                     400,
//                     null,
//                     "poster file(key) and orientation is required"
//                );
//           }

//           await new PosterModel({
//                video_id: vidDb._id,
//                key: poster2_data.key,
//                dimension: poster2_data.dimension,
//           }).save();

//           const titleExist = await VideosModel.findOne({ title: title });

//           if (titleExist) {
//                return failedResponse(
//                     req,
//                     400,
//                     title,
//                     "video woth thos title alrealdy exist!"
//                );
//           }

//           if (
//                !title ||
//                !type ||
//                !key ||
//                !description ||
//                !vid_class ||
//                !pg ||
//                !genre ||
//                !category
//           ) {
//                return invalidRequest(
//                     res,
//                     400,
//                     null,
//                     "you have not filled all the required fields"
//                );
//           }

//           await VideosModel.updateOne(
//                { _id: vidDb._id },
//                {
//                     title,
//                     type,
//                     key,
//                     description,
//                     class: vid_class,
//                     pg,
//                     genre,
//                     category,
//                     released_date: new Date(released_date),
//                     expiry_date: new Date(expiry_date),
//                }
//           );

//           successResponse(
//                req,
//                200,
//                null,
//                "video and its meta-data added successfully"
//           );
//      } catch (error) {
//           return serverError(res, 500, null, error.message);
//      }
// };

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

exports.createLive = async (req, res) => {
     try {
          const {
               client_id,
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
          } = req.body;

          if (
               !client_id ||
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
                                        $lte: ["$start", Date.now()],
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
               start: start,
               expiry: expiry,
               sponsored,
               popular,
               location,
               preview_video: video,
          }).save();

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

exports.addSubtitle = async (req, res) => {
     try {
          const { vid_id, bucket, key, language, is_series } = req.body;

          const vid = await VideosModel.findOne({ _id: vid_id });

          if (!vid) {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "specified video id not found"
               );
          }

          await new SubtitleModel({
               video_id: vid_id,
               bucket,
               key,
               language,
               is_series,
          }).save();

          return successResponse(res, 200, null, "subtitle added successfully");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

//TODO
// GET VIDEOS VOD BY THEIR TYPES... AS ON THE FIGMA MOVIES, SERIES, ...., GET EACH BY CATEG, AND UPLOAD EACH
// WANT TO ALSO WORK ON HOW TO MANAGE SERIES TOGETHER WITH MOVIES EFFICIENTLY

// ALSO HERE.... create lives by client type (channels, tvshow, ...)
//get adctive streams.. as on the figma design
