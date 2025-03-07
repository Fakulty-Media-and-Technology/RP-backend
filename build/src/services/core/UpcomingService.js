"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpcomingService = void 0;
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const denyGuestUser_1 = require("../../utils/denyGuestUser");
const VideoUploadUtils_1 = require("../../utils/VideoUploadUtils");
const VideoRepo_1 = require("../../repositories/VideoRepo");
const MovieMediaSourcesUtils_1 = require("../../utils/MovieMediaSourcesUtils");
const videos_model_1 = require("../../models/videos.model");
const lives_model_1 = require("../../models/lives.model");
const LiveRepo_1 = require("../../repositories/LiveRepo");
const LiveMediaSourcesUtils_1 = require("../../utils/LiveMediaSourcesUtils");
class UpcomingService {
}
exports.UpcomingService = UpcomingService;
_a = UpcomingService;
UpcomingService.adminFetch = async ({ contentType, ...params }) => {
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(params.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(params.limit, 10);
    return contentType === 'vod'
        ? await MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(await VideoRepo_1.VideoRepo.fetchUpcoming(page, limit), true, '720p')
        : await LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(await LiveRepo_1.LiveRepo.fetchUpcoming(page, limit), '720p');
};
UpcomingService.customerFetch = async ({ contentType, currentUser, ...params }) => {
    (0, denyGuestUser_1.denyGuestUser)(currentUser);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(params.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(params.limit, 10);
    const videoQuality = await VideoUploadUtils_1.VidUploadUtils.getUserVideoQuality(currentUser._id.toString(), '480p');
    return contentType === 'vod'
        ? await MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(await VideoRepo_1.VideoRepo.fetchActiveUpcoming(page, limit), true, videoQuality)
        : await LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(await LiveRepo_1.LiveRepo.fetchActiveUpcoming(page, limit), videoQuality);
};
UpcomingService.customerSubscription = async ({ currentUser, action, contentId, contentType, }) => {
    (0, denyGuestUser_1.denyGuestUser)(currentUser);
    const sharedFilter = {
        _id: contentId,
        upcoming: true,
    };
    const sharedUpdate = {
        [action === 'subscribe' ? '$addToSet' : '$pull']: {
            upcomingSubscribers: currentUser._id,
        },
        new: true,
    };
    let upcoming;
    if (contentType === 'live') {
        upcoming = await lives_model_1.LiveModel.findOneAndUpdate(sharedFilter, sharedUpdate);
    }
    else {
        upcoming = await videos_model_1.VideoModel.findOneAndUpdate(sharedFilter, sharedUpdate);
    }
    if (upcoming === null) {
        throw new OperationalError_1.OperationalError('content not found or is not an upcoming content ', 400);
    }
};
UpcomingService.customerIsSubscribed = async ({ currentUser, contentType, contentId, }) => {
    (0, denyGuestUser_1.denyGuestUser)(currentUser);
    const cond = {
        _id: contentId,
        upcomingSubscribers: currentUser._id,
    };
    return Boolean(contentType === 'live' ? await lives_model_1.LiveModel.findOne(cond) : await videos_model_1.VideoModel.findOne(cond));
};
