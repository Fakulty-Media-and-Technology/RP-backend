// ....
const Video = require("../../models/videos.model");
const User = require("../../models/users.model");
const Wallet = require("../../models/wallet.model");

const LiveVideos = require("../../models/lives.model");
const {
     serverError,
     successResponse,
     failedResponse,
     invalidRequest,
} = require("../../utils/response.handler");

exports.fetchUsersByVideoType = async (req, res) => {
     try {
          const { type } = req.query;
          if (!type) {
               return failedResponse(
                    res,
                    400,
                    null,
                    "video type query parameter is required "
               );
          }
          const users = await Video.aggregate([
               // Match videos by the specified type

               { $match: { type: type } },

               // Project the fields from both video and user details
               {
                    $project: {
                         _id: 0,
                         videoTitle: "$title",
                         videoPhoto: "$key",
                         photos: "$pg",
                    },
               },
          ]);

          console.log(users);
          return successResponse(res, 200, users, null);
     } catch (error) {
          return failedResponse(res, 200, null, "failed to fetch users");
     }
};

// Function to fetch all channels
exports.adminFetchChannel = async (req, res) => {
     //  query to find all channels
     try {
          const channels = await Live.aggregate([
               { $match: { type: "channel" } },
               { $project: { title: 1, cover_photo: 1 } },
          ]);

          return successResponse(res, 200, channels, null);
     } catch (error) {
          return failedResponse(res, 404, null, "error fetching channels");
     }
};

// Function to fetch total balance and total number of users
exports.adminFetchBalanceAndUser = async (req, res) => {
     try {
          //  query to sum the balance and count the users
          const result = await Wallet.aggregate([
               {
                    $lookup: {
                         from: "users",
                         localField: "user_id",
                         foreignField: "_id",
                         as: "user_details",
                    },
               },
               {
                    $group: {
                         _id: null,
                         totalBalance: { $sum: "$balance" },
                         totalUsers: { $sum: 1 },
                         users: { $push: "$user_details" },
                    },
               },
               {
                    $project: {
                         _id: 0,
                         totalBalance: 1,
                         totalUsers: 1,
                    },
               },
          ]);
          return successResponse(res, 200, result, null);
     } catch (error) {
          console.error("Error fetching total balance and users:", error);
          return failedResponse(
               res,
               404,
               null,
               "error in calculating the total balance and user"
          );
     }
};

exports.countFreeUsers = async (req, res) => {
     try {
          // to calculate  free users
          const result = await LiveVideos.aggregate([
               { $match: { vid_class: "free" } },
               { $count: "totalFreeUsers" },
          ]);

          let totalFreeUsers = 0;
          if (result.length > 0 && result[0].totalFreeUsers) {
               totalFreeUsers = result[0].totalFreeUsers;
          }
          return successResponse(
               res,
               200,
               { totalFreeUsers: totalFreeUsers },
               null
          );
     } catch (error) {
          console.error("Error counting free users:", error);
          return failedResponse(
               res,
               404,
               null,
               "error in calculating the total of free user",
               error
          );
     }
};

exports.countActiveUsers = async (req, res) => {
     try {
          // to calculate  free users
          const result = await LiveVideos.aggregate([
               { $match: { active: true } },
               { $count: "totalActiveUsers" },
          ]);

          let totalActiveUsers = 0;
          if (result.length > 0 && result[0].totalActiveUsers) {
               totalActiveUsers = result[0].totalActiveUsers;
          }
          return successResponse(res, 200, totalActiveUsers, null);
     } catch (error) {
          return failedResponse(
               res,
               404,
               null,
               "error in calculating the total of Active user",
               error
          );
     }
};

exports.countChannels = async (req, res) => {
     try {
          // to calculate  total channel
          const result = await LiveVideos.aggregate([
               { $match: { type: "channel" } },
               { $count: "totalChannels" },
          ]);

          let totalChannels = 0;
          if (result.length > 0 && result[0].totalChannels) {
               totalChannels = result[0].totalChannels;
          }
          return successResponse(res, 200, totalChannels, null);
     } catch (error) {
          return failedResponse(
               res,
               404,
               null,
               "error in calculating the total of channels",
               error
          );
     }
};

exports.countEvents = async (req, res) => {
     try {
          // to calculate  total channel
          const result = await LiveVideos.aggregate([
               { $match: { type: "event" } },
               { $count: "totalEvents" },
          ]);

          let totalEvents = 0;
          if (result.length > 0 && result[0].totalEvents) {
               totalEvents = result[0].totalEvents;
          }
          return successResponse(res, 200, totalEvents, null);
     } catch (error) {
          return failedResponse(
               res,
               404,
               null,
               "error in calculating the total of events",
               error
          );
     }
};
