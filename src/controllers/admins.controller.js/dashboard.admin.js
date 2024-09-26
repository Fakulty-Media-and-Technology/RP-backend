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
const UsersModel = require("../../models/users.model");
const { EncryptPass } = require("../../utils/bcrypt");
const { deletePhoto } = require("../../services/media-management");

function isValidEmail(email) {
     const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
     return emailRegex.test(email);
}

exports.currentAdminProfile = async (req, res) => {
     try {
          const id = req.user._id;

          const admin = await UsersModel.aggregate([
               {
                    $match: {
                         $expr: {
                              $eq: [
                                   "$_id",
                                   {
                                        $toObjectId: id,
                                   },
                              ],
                         },
                    },
               },
               {
                    $project: {
                         auth_code: 0,
                         auth_expiry: 0,
                         approved: 0,
                         suspended: 0,
                         updatedAt: 0,
                         __v: 0,
                         pin: 0,
                         password: 0,
                    },
               },
          ]);

          return successResponse(res, 200, admin, "admin profile");
     } catch (error) {
          return serverError(res, 500, null, error.message);
     }
};

exports.editAdminProfile = async (req, res) => {
     try {
          const user = req.user;

          const {
               first_name,
               last_name,
               country_code,
               mobile,
               photo,
               email,
               password,
          } = req.body;

          if (email) {
               const bol = isValidEmail(email);

               if (!bol) {
                    return invalidRequest(
                         res,
                         400,
                         null,
                         "invalid email format"
                    );
               }

               const existUs = await UsersModel.findOne({ email: email });

               if (existUs) {
                    return invalidRequest(
                         res,
                         409,
                         null,
                         "Email already in use"
                    );
               }
          }

          let initData = await UsersModel.findOne({ _id: user.id });
          if (!initData) {
               return invalidRequest(res, 404, null, "User not found");
          }

          if (photo) {
               await deletePhoto(initData.photo);

               initData.photo = {};
          }

          await UsersModel.findOneAndUpdate(
               {
                    _id: user._id,
               },
               {
                    email: email ? email : initData.email,
                    password: password
                         ? await EncryptPass(password)
                         : initData.password,
                    first_name: first_name ? first_name : initData.first_name,
                    last_name: last_name ? last_name : initData.last_name,
                    country_code: country_code
                         ? country_code
                         : initData.country_code,
                    mobile: mobile ? mobile : initData.mobile,
                    photo: photo ? photo : initData.photo,
               }
          );

          return successResponse(res, 200, null, "Profile updated");
     } catch (error) {
          console.error("Server error:", error);
          return serverError(res, 500, null, error.message);
     }
};

exports.fetchUsersByVideoType = async (req, res) => {
     try {
          const { type } = req.query;
          if (!type) {
               return invalidResponse(
                    res,
                    400,
                    null,
                    "video type query parameter is required "
               );
          }
          const videos = await Video.aggregate([
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

          return successResponse(res, 200, videos, "videos fetched by types");
     } catch (error) {
          return serverError(res, 500, null, error.message);
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

          return successResponse(res, 200, channels);
     } catch (error) {
          return serverError(res, 500, null, "error fetching channels");
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
          return successResponse(res, 200, result);
     } catch (error) {
          console.error("Error fetching total balance and users:", error);
          return serverError(
               res,
               500,
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
               "total of free user count"
          );
     } catch (error) {
          console.error("Error counting free users:", error);
          return serverError(
               res,
               500,
               null,
               "error in calculating the total of free user"
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
          return successResponse(
               res,
               200,
               totalActiveUsers,
               "total active user fetched"
          );
     } catch (error) {
          return serverError(
               res,
               500,
               null,
               "error in calculating the total of Active user"
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
          return successResponse(
               res,
               200,
               totalChannels,
               "total channel fetched"
          );
     } catch (error) {
          return serverError(
               res,
               500,
               null,
               "error in calculating the total of channels"
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
          return successResponse(res, 200, totalEvents, "total events fetched");
     } catch (error) {
          return serverError(
               res,
               500,
               null,
               "error in calculating the total of events"
          );
     }
};
