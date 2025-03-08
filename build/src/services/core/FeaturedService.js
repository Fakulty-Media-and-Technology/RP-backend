"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedService = void 0;
const LiveRepo_1 = require("../../repositories/LiveRepo");
const VideoRepo_1 = require("../../repositories/VideoRepo");
const LiveMediaSourcesUtils_1 = require("../../utils/LiveMediaSourcesUtils");
const MovieMediaSourcesUtils_1 = require("../../utils/MovieMediaSourcesUtils");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const VideoService_1 = require("./VideoService");
class FeaturedService {
}
exports.FeaturedService = FeaturedService;
_a = FeaturedService;
FeaturedService.searchVideosByText = async (text) => {
    const reg = new RegExp(text, 'i');
    const [vods, events] = await Promise.all([
        MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(await VideoRepo_1.VideoRepo.searchTitleOrDescriptionByTextReg(reg), true, '1080p'),
        LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(await LiveRepo_1.LiveRepo.searchLivesByTextReg(reg), '1080p'),
    ]);
    return { vods, events };
};
FeaturedService.addFeatured = async ({ id, type, expiry }) => {
    const newFeatured = type === 'vod'
        ? await VideoService_1.VideoService.addFeatured(id, expiry)
        : await VideoService_1.VideoService.Live.addFeatured(id, expiry);
    if (newFeatured === null) {
        throw new OperationalError_1.OperationalError('Invalid Id', 404);
    }
};
FeaturedService.getFeaturedContents = async (query) => {
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 1);
    const [vods, events] = await Promise.all([
        MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(await VideoRepo_1.VideoRepo.fetchFeatured(page, limit), true, '720p'),
        LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(await LiveRepo_1.LiveRepo.getFeatured(page, limit), '720p'),
    ]);
    return {
        vods_contents: vods,
        lives_contents: events,
    };
};
