const LivesModel = require("../../models/lives.model");
const UsersModel = require("../../models/users.model");
const { readPhotos } = require("../../services/media-access");
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
                              $eq: ["$client_id", { $toObjectId: user.id }],
                         },
                    },
               },
               {
                    $addFields: {
                         stream_server: strm_url,
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

exports.postPreviewVid = async (req, res) => {
     try {
          const { live_id } = req.params;
          const { video } = req.body;

          await LivesModel.findOneAndUpdate(
               {
                    _id: live_id,
               },
               {
                    preview_video: video,
               },
               {
                    upsert: true,
               }
          );

          return successResponse(res, 200, null, "event preview video posted");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
