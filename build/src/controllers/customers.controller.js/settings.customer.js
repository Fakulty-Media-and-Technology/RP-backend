"use strict";
const UserSettingsModel = require('../../models/userSettings.model');
const { serverError, successResponse, invalidRequest } = require('../../utils/response.handler');
exports.notificationSettings = async (req, res) => {
    try {
        const user = req.user;
        if (!user._id && user.role === 'guest') {
            return invalidRequest(res, 403, null, 'you are not authenticated');
        }
        const { video_quality, allow_notifications, new_services, upcoming_events, new_arrivals, live_channels, } = req.body;
        await UserSettingsModel.findOneAndUpdate({
            user_id: user._id,
        }, {
            video_quality: video_quality,
            allow_notifications: allow_notifications,
            new_services: new_services,
            upcoming_events: upcoming_events,
            new_arrivals: new_arrivals,
            live_channels: live_channels,
        }, {
            upsert: true,
        });
        return successResponse(res, 200, null, 'notification settings edited');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.addToWatchList = async (req, res) => {
    try {
        const user = req.user;
        if (!user._id && user.role === 'guest') {
            return invalidRequest(res, 403, null, 'you are not authenticated');
        }
        const { vid_id } = req.body;
        if (!vid_id) {
            return invalidRequest(res, 400, null, 'vid_id is required');
        }
        //TODO check if video exist
        await UserSettingsModel.findOneAndUpdate({
            user_id: user._id,
        }, {
            $push: {
                watchlist: vid_id.toString(),
            },
        }, {
            upsert: true,
        });
        return successResponse(res, 200, null, 'video added to watchlist');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.remFromWatchList = async (req, res) => {
    try {
        const user = req.user;
        if (!user._id && user.role === 'guest') {
            return invalidRequest(res, 403, null, 'you are not authenticated');
        }
        const { vid_id } = req.body;
        if (!vid_id) {
            return invalidRequest(res, 400, null, 'vid_id is required');
        }
        //TODO check if video exist
        await UserSettingsModel.findOneAndUpdate({
            user_id: user._id,
        }, {
            $pull: {
                watchlist: vid_id.toString(),
            },
        }, {
            new: true,
        });
        return successResponse(res, 200, null, 'video removed from watchlist');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.addToInterest = async (req, res) => {
    try {
        const user = req.user;
        if (!user._id && user.role === 'guest') {
            return invalidRequest(res, 403, null, 'you are not authenticated');
        }
        const { interest } = req.body;
        if (!interest) {
            return invalidRequest(res, 400, null, 'interest is required');
        }
        await UserSettingsModel.findOneAndUpdate({
            user_id: user._id,
        }, {
            interest: interest,
        }, {
            upsert: true,
        });
        return successResponse(res, 200, null, 'interest added to list');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
// exports.remFromInterest = async (req, res) => {
//     try {
//         const user = req.user;
//         const { interest } = req.body;
//         if (!interest) {
//             return invalidRequest(res, 400, null, "interest is required");
//         }
//         await UserSettingsModel.findOneAndUpdate(
//             {
//                 user_id: user._id,
//             },
//             {
//                 $pull: {
//                     interest: interest.toString(),
//                 },
//             },
//             {
//                 new: true,
//             }
//         );
//         return successResponse(res, 200, null, "interest removed from list");
//     } catch (error) {
//         return serverError(res, 500, null, error.message);
//     }
// };
