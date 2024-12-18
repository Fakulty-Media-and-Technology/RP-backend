"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSettingsService = void 0;
const userSettings_model_1 = require("../../models/userSettings.model");
const OperationalError_1 = require("../../utils/OperationalError");
class CustomerSettingsService {
}
exports.CustomerSettingsService = CustomerSettingsService;
_a = CustomerSettingsService;
CustomerSettingsService.pushInterest = async (currentUser, interest) => {
    if (currentUser.role === 'guest') {
        throw new OperationalError_1.OperationalError('you are not authenticated', 403);
    }
    await userSettings_model_1.SettingsModel.findOneAndUpdate({
        user_id: currentUser._id,
    }, {
        $push: { interest },
    }, {
        upsert: true,
    });
};
CustomerSettingsService.pushPullFromWatchlist = async (currentUser, videoId, type) => {
    const change = { watchlist: videoId };
    const filter = {
        user_id: currentUser._id,
    };
    const changes = {};
    if (type === 'pull') {
        changes.$pull = change;
        filter.watchlist = videoId;
    }
    else {
        changes.$push = change;
    }
    await userSettings_model_1.SettingsModel.findOneAndUpdate(filter, changes, {
        new: true,
    });
};
CustomerSettingsService.setNotificationSettings = async (currentUser, data) => {
    if (currentUser.role === 'guest') {
        throw new OperationalError_1.OperationalError('you are not authenticated', 403);
    }
    const { video_quality, allow_notifications, new_services, upcoming_events, new_arrivals, live_channels, } = data;
    await userSettings_model_1.SettingsModel.findOneAndUpdate({
        user_id: currentUser.id,
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
};
