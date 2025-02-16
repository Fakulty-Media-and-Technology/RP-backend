"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerMediaController = void 0;
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
const videos_model_1 = require("../../models/videos.model");
const LiveRepo_1 = require("../../repositories/LiveRepo");
const denyGuestUser_1 = require("../../utils/denyGuestUser");
const lives_model_1 = require("../../models/lives.model");
const OperationalError_1 = require("../../utils/OperationalError");
const env_1 = __importDefault(require("../../env"));
const media_management_1 = require("../../services/media-management");
const live_1 = require("../../utils/live");
const VideoRepo_1 = require("../../repositories/VideoRepo");
const media_controller_1 = require("../common/media.controller");
const LiveMediaSourcesUtils_1 = require("../../utils/LiveMediaSourcesUtils");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const MovieMediaSourcesUtils_1 = require("../../utils/MovieMediaSourcesUtils");
const VideoUploadUtils_1 = require("../../utils/VideoUploadUtils");
class CustomerMediaController extends media_controller_1.MediaController {
}
exports.CustomerMediaController = CustomerMediaController;
_a = CustomerMediaController;
CustomerMediaController.uploadImageRoute = Catch_1.Catch.async(async ({ file, user }, res) => {
    (0, denyGuestUser_1.denyGuestUser)(GetDefined_1.GetDefined.loggedInUser(user));
    if (!file) {
        throw new OperationalError_1.OperationalError('Upload an image', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        data: await media_management_1.MediaManagement.store({ file, baseDir: 'images', expire: undefined }),
        message: 'image uploaded',
    });
});
CustomerMediaController.getFeaturedVods = Catch_1.Catch.async(async ({ query, user }, res) => {
    const vidQuality = await VideoUploadUtils_1.VidUploadUtils.getUserVideoQuality(GetDefined_1.GetDefined.loggedInUser(user)._id.toString());
    const vods = await MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(await VideoRepo_1.VideoRepo.fetchFeatured((0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1), (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10)), true, vidQuality);
    (0, responder_1.sendResponse)({
        res,
        data: vods,
        message: 'featured contents fetched successful',
    });
});
CustomerMediaController.getFeaturedLives = Catch_1.Catch.async(async ({ query, user }, res) => {
    const vidQuality = await VideoUploadUtils_1.VidUploadUtils.getUserVideoQuality(GetDefined_1.GetDefined.loggedInUser(user)._id.toString());
    (0, responder_1.sendResponse)({
        res,
        message: 'featured contents fetched successful',
        data: await LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(await LiveRepo_1.LiveRepo.getFeatured((0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1), (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10)), vidQuality),
    });
});
// ***************** likes ************************ //
CustomerMediaController.likeVideo = Catch_1.Catch.async(async (req, res) => {
    const streamId = req.params.id;
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    const resLikes = await videos_model_1.VideoModel.findById(streamId);
    if (resLikes == null) {
        throw new OperationalError_1.OperationalError('Could not find video by streamId', 404);
    }
    if (resLikes.likes.includes(user._id)) {
        throw new OperationalError_1.OperationalError('user already liked', 400);
    }
    await videos_model_1.VideoModel.findByIdAndUpdate(streamId, {
        $push: {
            likes: user._id,
        },
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'video liked',
    });
});
CustomerMediaController.userLikedVideo = Catch_1.Catch.async(async (req, res) => {
    const streamId = req.params.id;
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    const resLikes = await videos_model_1.VideoModel.findById(streamId);
    if (resLikes == null) {
        throw new OperationalError_1.OperationalError('Could not find video by streamId', 404);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'check user liked',
        data: {
            user_liked: resLikes.likes.includes(user.id),
        },
    });
});
CustomerMediaController.unLikeVideo = Catch_1.Catch.async(async (req, res) => {
    const streamId = req.params.id;
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    const vod = await videos_model_1.VideoModel.findOneAndUpdate({
        _id: streamId,
        likes: user.id,
    }, {
        $pull: {
            likes: user.id,
        },
    });
    if (vod === null) {
        throw new OperationalError_1.OperationalError('user did not like the video or video does not exist', 404);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'video unliked',
    });
});
// ************ GET EVENTS *********************//
CustomerMediaController.getLiveEventsByType = (type) => Catch_1.Catch.async(async (req, res) => {
    let filter = { expired: false };
    switch (type) {
        case 'featured':
            filter.featured = true;
            break;
        case 'sponsored':
            filter.sponsored = true;
            break;
        case 'channels':
            filter.type = 'channel';
            break;
        case 'channels popular':
            filter.type = 'channel';
            filter.popular = true;
            break;
        case 'events':
            filter.type = 'event';
            break;
        case 'events popular':
            filter.type = 'event';
            filter.popular = true;
            break;
        case 'tvshows':
            filter.type = 'tvshow';
            break;
        case 'tvshows popular':
            filter.type = 'tvshow';
            filter.popular = true;
            break;
        case 'sports popular':
            filter.type = 'sport';
            filter.popular = true;
            break;
        case 'sports':
            filter.type = 'sport';
            break;
        case 'podcasts':
            filter.type = 'podcast';
            break;
        case 'podcasts popular':
            filter.type = 'podcast';
            filter.popular = true;
            break;
        default:
            filter = filter;
            break;
    }
    const vidQuality = await VideoUploadUtils_1.VidUploadUtils.getUserVideoQuality(GetDefined_1.GetDefined.loggedInUser(req.user)._id.toString());
    const liveEvents = await LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(await LiveRepo_1.LiveRepo.getSelectedLive(filter, (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(req.query.page, 1), (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(req.query.limit, 10)), vidQuality);
    (0, responder_1.sendResponse)({
        res,
        data: liveEvents,
        message: 'Events fetched',
    });
});
CustomerMediaController.bannerContents = Catch_1.Catch.async(async (req, res) => {
    const vidQuality = await VideoUploadUtils_1.VidUploadUtils.getUserVideoQuality(GetDefined_1.GetDefined.loggedInUser(req.user)._id.toString());
    let lives;
    let vods;
    [lives, vods] = await Promise.all([
        LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(await LiveRepo_1.LiveRepo.getFeatured(), vidQuality),
        MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(await VideoRepo_1.VideoRepo.fetchFeatured(), true, vidQuality),
    ]);
    if (lives.length + vods.length < 10) {
        ;
        [lives, vods] = await Promise.all([
            LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(await LiveRepo_1.LiveRepo.getMostEngaged(), vidQuality),
            MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(await VideoRepo_1.VideoRepo.fetchMostEngaged(), true, vidQuality),
        ]);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'contents fetched',
        data: {
            lives,
            vods,
        },
    });
});
CustomerMediaController.streamLiveEvent = Catch_1.Catch.async(async (req, res) => {
    const streamId = req.params.id;
    const event = await lives_model_1.LiveModel.findById(streamId);
    if (event == null) {
        throw new OperationalError_1.OperationalError('invalid stream ID', 404);
    }
    if (event.expired) {
        throw new OperationalError_1.OperationalError('stream event has expired', 400);
    }
    const signed = `?sign=${(0, live_1.signCred)(event.stream_key, event.expiry)}`;
    const stream_url = `${env_1.default.RP_HLS_URL}${event.stream_key}/index.m3u8` + signed;
    const data = {
        live_data: event,
        url: stream_url,
    };
    (0, responder_1.sendResponse)({
        res,
        data,
        message: 'live event fetched',
    });
});
