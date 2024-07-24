const TrailerModel = require("../../models/trailer.model");
const UpcomingModel = require("../../models/upcoming.model");
const {
     successResponse,
     serverError,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

exports.createTrailer = async (req, res) => {
     try {
          const { bucket, key, video_id, video_title, details } = req.body;

          const addTrailer = new TrailerModel({
               video_id: video_id,
               video_title: video_title,
               details: details,
               bucket: bucket,
               key: key,
          });

          const trail = await addTrailer.save();

          return successResponse(res, 200, trail, "trailer added");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
