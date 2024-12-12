"use strict";
// ....
const Video = require('../../models/videos.model');
const User = require('../../models/users.model');
const Wallet = require('../../models/wallet.model');
const LiveVideos = require('../../models/lives.model');
const { serverError, successResponse, failedResponse, invalidRequest, } = require('../../utils/response.handler');
const UsersModel = require('../../models/users.model');
const { EncryptPass } = require('../../utils/bcrypt');
const { deletePhoto } = require('../../services/media-management');
const { readPhotos } = require('../../services/media-access');
const PosterModel = require('../../models/poster.model');
const SubscriptionModel = require('../../models/subscription.model');
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
                            '$_id',
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
        return successResponse(res, 200, admin, 'admin profile');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.editAdminProfile = async (req, res) => {
    try {
        const user = req.user;
        const { first_name, last_name, country_code, mobile, photo, email, password } = req.body;
        if (email) {
            const bol = isValidEmail(email);
            if (!bol) {
                return invalidRequest(res, 400, null, 'invalid email format');
            }
            const existUs = await UsersModel.findOne({ email: email });
            if (existUs) {
                return invalidRequest(res, 409, null, 'Email already in use');
            }
        }
        let initData = await UsersModel.findOne({ _id: user.id });
        if (!initData) {
            return invalidRequest(res, 404, null, 'User not found');
        }
        if (photo) {
            await deletePhoto(initData.photo);
            initData.photo = {};
        }
        await UsersModel.findOneAndUpdate({
            _id: user._id,
        }, {
            email: email ? email : initData.email,
            password: password ? await EncryptPass(password) : initData.password,
            first_name: first_name ? first_name : initData.first_name,
            last_name: last_name ? last_name : initData.last_name,
            country_code: country_code ? country_code : initData.country_code,
            mobile: mobile ? mobile : initData.mobile,
            photo: photo ? photo : initData.photo,
        });
        return successResponse(res, 200, null, 'Profile updated');
    }
    catch (error) {
        console.error('Server error:', error);
        return serverError(res, 500, null, error.message);
    }
};
exports.fetchTopVideosByType = async (req, res) => {
    try {
        const { type } = req.query;
        if (!type) {
            return invalidResponse(res, 400, null, 'video type query parameter is required ');
        }
        const videos = await Video.aggregate([
            // Match videos by the specified type
            { $match: { type: type } },
            {
                $addFields: {
                    photo: 'no photo',
                },
            },
            {
                $project: {
                    __v: 0,
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
            {
                $limit: 5,
            },
        ]);
        const finnVal = await Promise.all(videos.map(async (video) => {
            const vidPhoto = await PosterModel.findOne({
                video_id: video._id,
            });
            if (vidPhoto) {
                const signedPhoto = await readPhotos(vidPhoto.bucket, vidPhoto.key);
                video.photo = signedPhoto;
                return video;
            }
            return video;
        }));
        return successResponse(res, 200, finnVal, 'videos fetched by types');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
// Function to fetch all channels
exports.adminFetchChannel = async (req, res) => {
    //  query to find all channels
    try {
        const channels = await Live.aggregate([
            { $match: { type: 'channel' } },
            { $project: { title: 1, cover_photo: 1 } },
        ]);
        return successResponse(res, 200, channels);
    }
    catch (error) {
        return serverError(res, 500, null, 'error fetching channels');
    }
};
// Function to fetch total balance and total number of users
exports.adminFetchBalanceAndUser = async (req, res) => {
    try {
        const totBal = await Wallet.aggregate([
            {
                $match: {
                    $expr: {
                        $ne: ['$user_id', null],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    total_balance: { $sum: '$balance' },
                },
            },
            {
                $project: {
                    _id: 0,
                    total_balance: 1,
                },
            },
        ]);
        const totUsers = await UsersModel.aggregate([
            {
                $match: {
                    $expr: {
                        $ne: ['$_id', null],
                    },
                },
            },
        ]);
        const activeSubs = await SubscriptionModel.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            {
                                $eq: ['$active', true],
                            },
                            {
                                $lte: [
                                    new Date(),
                                    {
                                        $toDate: '$expiry_date',
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        ]);
        const freeeUsers = await UsersModel.aggregate([
            {
                $match: {
                    $expr: {
                        $ne: ['$_id', null],
                    },
                },
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    let: {
                        uid: '$_id',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                '$user_id',
                                                {
                                                    $toObjectId: '$$uid',
                                                },
                                            ],
                                        },
                                        {
                                            $eq: ['$active', true],
                                        },
                                        {
                                            $lte: [
                                                new Date(),
                                                {
                                                    $toDate: '$expiry_date',
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'user_sub',
                },
            },
            {
                $match: {
                    $expr: {
                        $eq: ['$user_sub', []],
                    },
                },
            },
        ]);
        return successResponse(res, 200, {
            totalBalance: totBal[0],
            totUsers: totUsers.length,
            freeUsers: freeeUsers.length,
            activeSubscriptions: activeSubs.length,
        }, 'Dashboard Balance and Users');
    }
    catch (error) {
        console.error('Error fetching total balance and users:', error);
        return serverError(res, 500, null, 'error in calculating the total balance and user');
    }
};
exports.totContentsAndChunks = async (req, res) => {
    try {
        const totVideos = await Video.aggregate([
            {
                $match: {
                    $expr: {
                        $ne: ['$_id', null],
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                },
            },
        ]);
        const totMovSeries = await Video.aggregate([
            {
                $match: {
                    $expr: {
                        $or: [
                            {
                                $eq: ['$type', 'movie'],
                            },
                            {
                                $eq: ['$type', 'series'],
                            },
                        ],
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                },
            },
        ]);
        const totMusVid = await Video.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: ['$type', 'music video'],
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                },
            },
        ]);
        const totSkit = await Video.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: ['$type', 'skit'],
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                },
            },
        ]);
        const totActiveEvents = await LiveVideos.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: ['$active', true],
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                },
            },
        ]);
        return successResponse(res, 200, {
            totalContents: totVideos.length + totActiveEvents.length,
            totalMovieSeries: totMovSeries.length,
            totalMusicVideos: totMusVid.length,
            totalSkits: totSkit.length,
            totalActiveEvents: totActiveEvents.length,
        }, 'total contents and chunks');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
// exports.countFreeUsers = async (req, res) => {
//      try {
//           // to calculate  free users
//           const result = await LiveVideos.aggregate([
//                { $match: { vid_class: "free" } },
//                { $count: "totalFreeUsers" },
//           ]);
//           let totalFreeUsers = 0;
//           if (result.length > 0 && result[0].totalFreeUsers) {
//                totalFreeUsers = result[0].totalFreeUsers;
//           }
//           return successResponse(
//                res,
//                200,
//                { totalFreeUsers: totalFreeUsers },
//                "total of free user count"
//           );
//      } catch (error) {
//           console.error("Error counting free users:", error);
//           return serverError(
//                res,
//                500,
//                null,
//                "error in calculating the total of free user"
//           );
//      }
// };
// exports.countActiveUsers = async (req, res) => {
//      try {
//           // to calculate  free users
//           const result = await LiveVideos.aggregate([
//                { $match: { active: true } },
//                { $count: "totalActiveUsers" },
//           ]);
//           let totalActiveUsers = 0;
//           if (result.length > 0 && result[0].totalActiveUsers) {
//                totalActiveUsers = result[0].totalActiveUsers;
//           }
//           return successResponse(
//                res,
//                200,
//                totalActiveUsers,
//                "total active user fetched"
//           );
//      } catch (error) {
//           return serverError(
//                res,
//                500,
//                null,
//                "error in calculating the total of Active user"
//           );
//      }
// };
// exports.countChannels = async (req, res) => {
//      try {
//           // to calculate  total channel
//           const result = await LiveVideos.aggregate([
//                { $match: { type: "channel" } },
//                { $count: "totalChannels" },
//           ]);
//           let totalChannels = 0;
//           if (result.length > 0 && result[0].totalChannels) {
//                totalChannels = result[0].totalChannels;
//           }
//           return successResponse(
//                res,
//                200,
//                totalChannels,
//                "total channel fetched"
//           );
//      } catch (error) {
//           return serverError(
//                res,
//                500,
//                null,
//                "error in calculating the total of channels"
//           );
//      }
// };
// exports.countEvents = async (req, res) => {
//      try {
//           // to calculate  total channel
//           const result = await LiveVideos.aggregate([
//                { $match: { type: "event" } },
//                { $count: "totalEvents" },
//           ]);
//           let totalEvents = 0;
//           if (result.length > 0 && result[0].totalEvents) {
//                totalEvents = result[0].totalEvents;
//           }
//           return successResponse(res, 200, totalEvents, "total events fetched");
//      } catch (error) {
//           return serverError(
//                res,
//                500,
//                null,
//                "error in calculating the total of events"
//           );
//      }
// };
