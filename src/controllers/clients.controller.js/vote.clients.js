const ContestantsModel = require("../../models/contestants.model");
const VoteInfoModel = require("../../models/voteInfo.model");
const {
     invalidRequest,
     successResponse,
     serverError,
} = require("../../utils/response.handler");

exports.createVoteInfo = async (req, res) => {
     try {
          const { live_id, price, status } = req.body;

          const user = req.user;
          if (user.role !== "tvshow") {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "this feature is not available to you"
               );
          }

          if (!live_id || !price || !status) {
               invalidRequest(res, 400, null, "all inputs are required");
          }

          await new VoteInfoModel({
               live_id: live_id,
               price: Number(price),
               status: status,
          }).save();

          return successResponse(res, 200, null, "vote-info instace created");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.addVoteContestant = async (req, res) => {
     try {
          const { live_id, names, occupation, bio, contact } = req.body;

          const user = req.user;
          if (user.role !== "tvshow") {
               return invalidRequest(
                    res,
                    400,
                    null,
                    "this feature is not available to you"
               );
          }

          if (!live_id || !names || !occupation || !bio || !contact) {
               invalidRequest(res, 400, null, "all inputs are required");
          }

          await new ContestantsModel({
               live_id: live_id,
               names: names,
               occupation: occupation,
               bio: bio,
               contact: contact,
          }).save();

          return successResponse(res, 200, null, "vote contestant added");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};
